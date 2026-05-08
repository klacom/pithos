import { retrievePaymentIntent } from '@/lib/payments/paymongo/paymongo';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAudit } from '@/lib/supabase/create-audit';

export async function POST(request: NextRequest) {

    const supabase = createAdminClient();

    const rawBody = await request.text();

    // DEBUG LOGS
    console.log("HEADERS:");
    console.log(Object.fromEntries(request.headers.entries()));

    console.log("RAW BODY:");
    console.log(rawBody);

    const signatureHeader =
        request.headers.get('Paymongo-Signature') ||
        request.headers.get('paymongo-signature');

    console.log("SIGNATURE HEADER:");
    console.log(signatureHeader);

    const webhookSecret = process.env.NEXT_PUBLIC_PAYMONGO_WEBHOOK_SECRET;

    console.log("WEBHOOK SECRET EXISTS:", !!webhookSecret);

    if (!signatureHeader || !webhookSecret) {
        return NextResponse.json(
            { error: 'Missing signature or webhook secret' },
            { status: 401 }
        );
    }

    const elements = signatureHeader.split(',');

    const timestamp = elements
        .find(v => v.startsWith('t='))
        ?.replace('t=', '');

    const testSignature = elements
        .find(v => v.startsWith('te='))
        ?.replace('te=', '');

    const liveSignature = elements
        .find(v => v.startsWith('li='))
        ?.replace('li=', '');

    const receivedSignature = testSignature || liveSignature;

    console.log("TIMESTAMP:", timestamp);
    console.log("RECEIVED SIGNATURE:", receivedSignature);

    if (!timestamp || !receivedSignature) {
        return NextResponse.json(
            { error: 'Invalid signature format' },
            { status: 401 }
        );
    }

    const payloadToSign = `${timestamp}.${rawBody}`;

    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadToSign)
        .digest('hex');

    console.log("EXPECTED SIGNATURE:", expectedSignature);

    if (expectedSignature !== receivedSignature) {
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
        );
    }

    try {

        const body = JSON.parse(rawBody);

        const eventType = body.data.attributes.type;
        const resource = body.data.attributes.data;

        if (
            eventType === 'payment.paid' ||
            eventType === 'checkout_session.payment.paid'
        ) {

            const payment =
                eventType === 'payment.paid'
                    ? resource.attributes
                    : resource.attributes.payments[0].attributes;

            const intentId =
                payment.payment_intent_id ||
                resource.attributes.payment_intent_id;

            const intentResponse = await retrievePaymentIntent(intentId);

            const intent = intentResponse.data;

            const { buyer_id, product_ids } =
                intent.attributes.metadata;

            if (buyer_id && product_ids) {

                const pids = product_ids.split(',');

                await supabase
                    .from('transactions')
                    .update({ status: 'completed' })
                    .eq('buyer_id', buyer_id)
                    .in('product_id', pids)
                    .eq('status', 'pending');

                await supabase
                    .from('cart')
                    .delete()
                    .eq('user_id', buyer_id)
                    .in('product_id', pids);

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

        console.error("WEBHOOK ERROR:");
        console.error(error);

        return NextResponse.json(
            { error: error.message || 'Webhook failed' },
            { status: 500 }
        );
    }
}