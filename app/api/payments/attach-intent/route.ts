import { fetchPayMongoAPI } from '@/lib/payments/paymongo/paymongo';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { intentId, paymentMethodType, clientKey } = body;

        if (!paymentMethodType) {
            throw new Error("Missing payment method type");
        }

        const normalizedType =
            paymentMethodType === "paymaya"
                ? "maya"
                : paymentMethodType;

        console.log("ATTACH PAYLOAD:", {
            type: paymentMethodType,
        });

        // 1. Create Payment Method
        const methodResponse = await fetchPayMongoAPI('/payment_methods', 'POST', {
            type: normalizedType,
        });

        const paymentMethodId = methodResponse.data.id;

        // 2. Attach to Intent
        const attachResponse = await fetchPayMongoAPI(`/payment_intents/${intentId}/attach`, 'POST', {
            payment_method: paymentMethodId,
            client_key: clientKey,
            return_url: `${request.nextUrl.origin}/shopping-cart/checkout/success`
        });

        return NextResponse.json(attachResponse);

    } catch (error: any) {
        console.error('Attach Intent Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
