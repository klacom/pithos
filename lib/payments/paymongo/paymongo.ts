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
    const authHeader = getAuthHeader();

    const options: RequestInit = {
        method,
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${PAYMONGO_API_BASE}${endpoint}`, options);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`PayMongo API Error: ${error.errors?.[0]?.detail || response.statusText}`);
    }

    return response.json();
}

export async function getBalance() {
    try {
        // PayMongo doesn't have a direct balance endpoint
        // We'll calculate from transactions
        const transactions = await listCharges();
        const totalAmount = transactions.data.reduce((sum: number, charge: any) => {
            if (charge.attributes.status === 'paid') {
                return sum + (charge.attributes.amount / 100); // Amount is in cents
            }
            return sum;
        }, 0);

        return totalAmount;
    } catch (error) {
        console.error('Error fetching balance:', error);
        throw error;
    }
}

export async function listCharges(limit: number = 50) {
    return fetchPayMongoAPI(`/charges?limit=${limit}`);
}

export async function getCharge(chargeId: string) {
    return fetchPayMongoAPI(`/charges/${chargeId}`);
}

export async function createCharge(data: {
    amount: number; // in cents (e.g., 100 = 1 PHP)
    currency: string;
    description?: string;
    source?: { id: string };
}) {
    return fetchPayMongoAPI('/charges', 'POST', data);
}
