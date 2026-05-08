import { createPaymentIntent } from '@/lib/payments/paymongo/paymongo';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAudit } from '@/lib/supabase/create-audit';

export async function POST(request: NextRequest) {
    const supabase = createAdminClient();
    const supabaseS = await createClient();

    try {
        const body = await request.json();
        const { productIds } = body;

        // Get actual user from supabase auth
        const { data: { user } } = await supabaseS.auth.getUser();
        const buyerId = user?.id;

        if (!buyerId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ error: 'No products provided' }, { status: 400 });
        }

        // Fetch products to calculate total and get seller info
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('product_id, price, seller_owner_id, product_name')
            .in('product_id', productIds);

        if (productsError || !products || products.length === 0) {
            return NextResponse.json({ error: 'Products not found' }, { status: 404 });
        }

        const totalAmountCents = products.reduce((sum, p) => sum + Math.round(p.price * 100), 0);
        
        // Ensure description is never empty and truncated if too long (PayMongo limit is 255)
        let description = products.length === 1
            ? `Purchase of ${products[0].product_name || 'Digital Asset'}`
            : `Purchase of ${products.length} items from Pithos`;
        
        if (description.length > 255) {
            description = description.substring(0, 252) + '...';
        }

        console.log("Creating Payment Intent with description:", description);

        // Create Payment Intent
        const intentResponse = await createPaymentIntent({
            amount: totalAmountCents,
            currency: 'PHP',
            payment_method_allowed: ['card', 'gcash', 'paymaya', 'grab_pay'],
            description: description,
            metadata: {
                buyer_id: buyerId,
                product_ids: productIds.join(','),
            }
        });

        const intent = intentResponse.data;

        // Store pending transactions with full details
        const transactions = products.map(p => ({
            buyer_id: buyerId,
            product_id: p.product_id,
            seller_id: p.seller_owner_id,
            status: 'pending',
            amount: p.price,
            seller_amount: p.price * 0.8,
            commission_amount: p.price * 0.2,
            paymongo_id: intent.id,
        }));

        const { error: txError } = await supabase
            .from('transactions')
            .insert(transactions);

        if (txError) {
            console.error('Error creating pending transactions:', txError);
        }

        // Audit the action
        await createAudit({
            action_name: 'CREATE_PAYMENT_INTENT',
            action_description: `Initiated purchase for products: ${productIds.join(', ')}`,
            affected_resources: `transactions:${transactions.map(t => t.product_id).join(',')}`,
            actor: buyerId
        });

        return NextResponse.json({
            clientKey: intent.attributes.client_key,
            intentId: intent.id,
            amount: totalAmountCents,
        });

    } catch (error: any) {
        console.error('Create Intent Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create payment intent' },
            { status: 500 }
        );
    }
}
