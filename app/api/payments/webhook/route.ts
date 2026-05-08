import { retrievePaymentIntent } from '@/lib/payments/paymongo/paymongo';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createAudit } from '@/lib/supabase/create-audit';
import { sendOrderEmail } from '@/lib/email/nodemailer';
import crypto from 'crypto';

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

    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

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

                // Fetch user and product details for notification
                const [userDataRes, productsRes] = await Promise.all([
                    supabase
                        .from('users')
                        .select('user_email, user_fullname')
                        .eq('id', buyer_id)
                        .single(),
                    supabase
                        .from('products')
                        .select('product_id, product_name')
                        .in('product_id', pids)
                ]);

                const userData = userDataRes.data;
                const productsData = productsRes.data || [];
                const productNameMap = new Map(productsData.map(p => [p.product_id, p.product_name]));

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

                // Send Success Email
                if (userData?.user_email) {
                    await sendOrderEmail(
                        userData.user_email,
                        "Order Successful - Pithos Marketplace",
                        `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h1 style="color: #22c55e;">Payment Successful!</h1>
                            <p>Hi ${userData.user_fullname || 'there'},</p>
                            <p>Thank you for your purchase. Your payment for the following items has been confirmed:</p>
                            <ul style="background: #f9fafb; padding: 15px 30px; border-radius: 8px; list-style: none;">
                                ${pids.map((id: any) => `
                                    <li style="margin-bottom: 10px; border-bottom: 1px solid #edf2f7; padding-bottom: 5px;">
                                        <strong>${productNameMap.get(id) || 'Unknown Product'}</strong><br/>
                                        <small style="color: #718096; font-family: monospace;">${id}</small>
                                    </li>
                                `).join('')}
                            </ul>
                            <p>You can now download your assets from your <a href="${request.nextUrl.origin}/buyer/account/purchase-history" style="color: #ef4444; font-weight: bold; text-decoration: none;">Purchase History</a>.</p>
                            <p>Happy creating!</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                            <p style="font-size: 12px; color: #a0aec0;">&copy; ${new Date().getFullYear()} Pithos Official. All rights reserved.</p>
                        </div>
                        `
                    );
                }
            }
        } else if (
            eventType === 'payment.failed' ||
            eventType === 'checkout_session.payment.failed'
        ) {
            const payment =
                eventType === 'payment.failed'
                    ? resource.attributes
                    : resource.attributes.payments?.[0]?.attributes;

            const intentId =
                payment?.payment_intent_id ||
                resource.attributes.payment_intent_id;

            const intent = await retrievePaymentIntent(intentId);
            const metadata = intent.data.attributes.metadata;
            const buyer_id = metadata?.buyer_id;
            const product_ids = metadata?.product_ids;

            if (buyer_id && product_ids) {
                const pids = product_ids.split(',');

                // Fetch user and product details for notification
                const [userDataRes, productsRes] = await Promise.all([
                    supabase
                        .from('users')
                        .select('user_email, user_fullname')
                        .eq('id', buyer_id)
                        .single(),
                    supabase
                        .from('products')
                        .select('product_id, product_name')
                        .in('product_id', pids)
                ]);

                const userData = userDataRes.data;
                const productsData = productsRes.data || [];
                const productNameMap = new Map(productsData.map(p => [p.product_id, p.product_name]));

                await supabase
                    .from('transactions')
                    .update({ status: 'failed' })
                    .eq('buyer_id', buyer_id)
                    .in('product_id', pids)
                    .eq('status', 'pending');

                await createAudit({
                    action_name: 'PAYMENT_FAILED_WEBHOOK',
                    action_description: `Payment failed for buyer ${buyer_id}, products: ${product_ids}`,
                    affected_resources: `transactions:${product_ids}`,
                    actor: buyer_id
                });

                // Send Failure Email
                if (userData?.user_email) {
                    await sendOrderEmail(
                        userData.user_email,
                        "Order Failed - Pithos Marketplace",
                        `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h1 style="color: #ef4444;">Payment Failed</h1>
                            <p>Hi ${userData.user_fullname || 'there'},</p>
                            <p>We're sorry, but your payment for the following items has failed:</p>
                            <ul style="background: #fef2f2; padding: 15px 30px; border-radius: 8px; list-style: none;">
                                ${pids.map((id: any) => `
                                    <li style="margin-bottom: 10px; border-bottom: 1px solid #fee2e2; padding-bottom: 5px;">
                                        <strong>${productNameMap.get(id) || 'Unknown Product'}</strong><br/>
                                        <small style="color: #991b1b; font-family: monospace;">${id}</small>
                                    </li>
                                `).join('')}
                            </ul>
                            <p>If you have any questions, please contact our support team at <a href="mailto:pithos.official@gmail.com" style="color: #ef4444;">pithos.official@gmail.com</a>.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                            <p style="font-size: 12px; color: #a0aec0;">&copy; ${new Date().getFullYear()} Pithos Official. All rights reserved.</p>
                        </div>
                        `
                    );
                }
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