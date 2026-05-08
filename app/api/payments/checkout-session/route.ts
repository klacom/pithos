import { fetchPayMongoAPI } from '@/lib/payments/paymongo/paymongo';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    const supabaseAdmin = createAdminClient();
    const supabaseServer = await createClient();
    
    try {
        const body = await request.json();
        const { productIds } = body;

        const { data: { user } } = await supabaseServer.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: products } = await supabaseAdmin
            .from('products')
            .select('product_id, product_name, price, seller_owner_id')
            .in('product_id', productIds);

        if (!products || products.length === 0) {
            return NextResponse.json({ error: 'Products not found' }, { status: 404 });
        }

        const lineItems = products.map(p => ({
            amount: Math.round(p.price * 100),
            currency: 'PHP',
            name: p.product_name,
            quantity: 1
        }));

        const sessionResponse = await fetchPayMongoAPI('/checkout_sessions', 'POST', {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            line_items: lineItems,
            payment_method_types: ['card', 'gcash', 'paymaya'],
            success_url: `${request.nextUrl.origin}/shopping-cart/checkout/success?session_id={CHECKOUT_SESSION_ID}&ids=${productIds.join(',')}`,
            cancel_url: `${request.nextUrl.origin}/shopping-cart/checkout`,
            metadata: {
                buyer_id: user.id,
                product_ids: productIds.join(',')
            }
        });

        return NextResponse.json({ checkoutUrl: sessionResponse.data.attributes.checkout_url });

    } catch (error: any) {
        console.error('Checkout Session Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
