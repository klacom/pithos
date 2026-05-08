import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const supabase = createAdminClient();

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            { count: totalTransactions },
            { count: todayTransactions },
            { count: totalSellers },
            { count: totalBuyers },
            { count: totalProducts },
            { data: revenueData }
        ] = await Promise.all([
            supabase.from('transactions').select('*', { count: 'exact', head: true }),
            supabase.from('transactions').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('user_role', 'seller'),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('user_role', 'buyer'),
            supabase.from('products').select('*', { count: 'exact', head: true }),
            supabase.from('transactions').select('created_at, amount').eq('status', 'completed')
        ]);

        // Process revenue data for chart
        const monthlyRevenue: Record<string, number> = {};
        revenueData?.forEach(tx => {
            const date = new Date(tx.created_at);
            const month = date.toLocaleString('default', { month: 'short' });
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (tx.amount || 0);
        });

        const chartData = Object.entries(monthlyRevenue).map(([name, total]) => ({
            name,
            total
        }));

        console.log("Chart Data:", chartData);

        return NextResponse.json({
            totalTransactions: totalTransactions || 0,
            todayTransactions: todayTransactions || 0,
            totalSellers: totalSellers || 0,
            totalBuyers: totalBuyers || 0,
            totalProducts: totalProducts || 0,
            chartData
        });

    } catch (error: any) {
        console.error('Admin Stats Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
