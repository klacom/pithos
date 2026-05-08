import { getBalance, listPayments, checkKeys, listWebhooks } from '@/lib/payments/paymongo/paymongo';
import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';

export async function GET(request: NextRequest) {
    noStore();
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type');

        if (type === 'balance') {
            const balance = await getBalance();
            return NextResponse.json({ balance });
        }

        if (type === 'transactions') {
            const limit = parseInt(searchParams.get('limit') || '50');
            const charges = await listPayments(limit);

            // Transform PayMongo charges to match dashboard format
            const transactions = charges.data.map((charge: any) => {
                const attr = charge.attributes;
                return {
                    id: charge.id,
                    txnId: charge.id.substring(0, 12),
                    amount: (attr.amount / 100).toFixed(2),
                    currency: attr.currency,
                    status: attr.status === 'paid' ? 'Completed' : attr.status === 'failed' ? 'Failed' : 'Pending',
                    created_at: attr.created_at,
                    description: attr.description,
                    gateway: 'PayMongo',
                };
            });

            return NextResponse.json({ transactions, total: charges.data.length });
        }

        if (type === 'stats') {
            const [charges, balance, keyStatus, webhooks] = await Promise.all([
                listPayments(100),
                getBalance(),
                checkKeys(),
                listWebhooks()
            ]);

            const total = charges.data.length;
            const paid = charges.data.filter((c: any) => c.attributes.status === 'paid').length;
            const failed = charges.data.filter((c: any) => c.attributes.status === 'failed').length;

            const successRate = total > 0 ? ((paid / total) * 100).toFixed(2) : '0.00';

            return NextResponse.json({
                balance: `₱${balance.toFixed(2)}`,
                successRate: `${successRate}%`,
                todayTransactions: total, 
                totalTransactions: total,
                failedCount: failed,
                keyStatus,
                webhookStatus: webhooks.data.length > 0 ? 'Active' : 'Inactive',
                webhookUrl: webhooks.data[0]?.attributes?.url || 'Not set'
            });
        }

        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    } catch (error: any) {
        console.error('PayMongo API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch PayMongo data' },
            { status: 500 }
        );
    }
}
