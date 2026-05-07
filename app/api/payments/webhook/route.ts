import { retrievePaymentIntent } from '@/lib/payments/paymongo/paymongo';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAudit } from '@/lib/supabase/create-audit';

export async function POST(request: NextRequest) {
    const supabase = createAdminClient();
    const payload = await request.text();
    const signature = request.headers.get('paymongo-signature');
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    // Verify signature if secret is set
    if (webhookSecret && signature) {
        const [timestampStr, signatureStr] = signature.split(',');
        const timestamp = timestampStr.split('=')[1];
        const receivedSig = signatureStr.split('=')[1];
        
        const baseString = timestamp + payload;
        const computedSig = crypto
            .createHmac('sha256', webhookSecret)
            .update(baseString)
            .digest('hex');

        if (computedSig !== receivedSig) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
    }

    try {
        const body = JSON.parse(payload);
        const eventType = body.data.attributes.type;
        const resource = body.data.attributes.data;

        if (eventType === 'payment.paid' || eventType === 'checkout_session.payment.paid') {
            const payment = eventType === 'payment.paid' ? resource.attributes : resource.attributes.payments[0].attributes;
            const intentId = payment.payment_intent_id || resource.attributes.payment_intent_id;
            
            // 1. Fetch the intent to get metadata (buyer_id, product_ids)
            const intentResponse = await retrievePaymentIntent(intentId);
            const intent = intentResponse.data;
            const { buyer_id, product_ids } = intent.attributes.metadata;

            if (buyer_id && product_ids) {
                const pids = product_ids.split(',');

                // 2. Update transactions to completed
                await supabase
                    .from('transactions')
                    .update({ status: 'completed' })
                    .eq('buyer_id', buyer_id)
                    .in('product_id', pids)
                    .eq('status', 'pending');

                // 3. Clear user's cart for these products
                await supabase
                    .from('cart')
                    .delete()
                    .eq('user_id', buyer_id)
                    .in('product_id', pids);

                // Audit the action
                await createAudit({
                    action_name: 'PAYMENT_SUCCESS_WEBHOOK',
                    action_description: `Payment confirmed for buyer ${buyer_id}, products: ${product_ids}`,
                    affected_resources: `transactions:${product_ids}`,
                    actor: buyer_id
                });
            }
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json(
            { error: error.message || 'Webhook handler failed' },
            { status: 500 }
        );
    }
}
