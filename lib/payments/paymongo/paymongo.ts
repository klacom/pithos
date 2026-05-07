import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1';

export function getPayMongoCredentials() {
    const publicKey = process.env.PAYMONGO_PUBLIC_KEY;
    const secretKey = process.env.PAYMONGO_SECRET_KEY;

    if (!publicKey || !secretKey) {
        throw new Error('Missing PayMongo API keys in environment variables');
    }

    return { publicKey, secretKey };
}

export function getAuthHeader() {
    const { secretKey } = getPayMongoCredentials();
    const encodedKey = Buffer.from(`${secretKey}:`).toString('base64');
    return `Basic ${encodedKey}`;
}

export async function fetchPayMongoAPI(
    endpoint: string,
    method: string = 'GET',
    body?: any
) {
    const { secretKey } = getPayMongoCredentials();
    const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;

    const options: RequestInit = {
        method,
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    };

    if (body && (method === 'POST' || method === 'PUT')) {
        const payload = { data: { attributes: body } };
        options.body = JSON.stringify(payload);
    }

    const url = `${PAYMONGO_API_BASE}${endpoint}`;

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            console.error(`PayMongo API Error (${endpoint}):`, JSON.stringify(result, null, 2));
            const errorDetail = result.errors?.[0]?.detail || response.statusText;
            throw new Error(`PayMongo API Error: ${errorDetail}`);
        }

        return result;
    } catch (error: any) {
        console.error(`PayMongo Fetch Error (${endpoint}):`, error.message);
        throw error;
    }
}

// Payment Intent API (Modern)
export async function createPaymentIntent(data: {
    amount: number;
    currency: string;
    payment_method_allowed?: string[];
    description?: string;
    metadata?: Record<string, any>;
}) {
    return fetchPayMongoAPI('/payment_intents', 'POST', data);
}

export async function retrievePaymentIntent(id: string) {
    return fetchPayMongoAPI(`/payment_intents/${id}`);
}

export async function attachPaymentIntent(intentId: string, data: {
    payment_method: string;
    client_key: string;
    return_url?: string;
}) {
    // This one is a bit special as it might redirect for 3DS/e-wallets
    return fetchPayMongoAPI(`/payment_intents/${intentId}/attach`, 'POST', data);
}

// Payment Method API
export async function createPaymentMethod(data: {
    type: string;
    details?: any;
    billing?: any;
}) {
    return fetchPayMongoAPI('/payment_methods', 'POST', data);
}

// Webhooks
export async function createWebhook(data: {
    url: string;
    events: string[];
}) {
    return fetchPayMongoAPI('/webhooks', 'POST', data);
}

export async function listWebhooks() {
    return fetchPayMongoAPI('/webhooks');
}

// Legacy/Simple Charges (Still useful for some cases)
export async function listPayments(limit: number = 50) {
    return fetchPayMongoAPI(`/payments?limit=${limit}`);
}

export async function getBalance() {
    try {
        const payments = await listPayments(100);
        const totalAmount = payments.data.reduce((sum: number, payment: any) => {
            if (payment.attributes.status === 'paid') {
                return sum + (payment.attributes.amount / 100);
            }
            return sum;
        }, 0);

        return totalAmount;
    } catch (error) {
        console.error('Error fetching balance:', error);
        throw error;
    }
}

export async function checkKeys() {
    try {
        const { publicKey, secretKey } = getPayMongoCredentials();
        const testRes = await fetchPayMongoAPI('/payments?limit=1');
        return {
            publicKey: publicKey ? 'Valid' : 'Missing',
            secretKey: secretKey ? 'Valid' : 'Missing',
            status: testRes ? 'Valid' : 'Invalid'
        };
    } catch (error) {
        return { publicKey: 'Error', secretKey: 'Error', status: 'Invalid' };
    }
}
