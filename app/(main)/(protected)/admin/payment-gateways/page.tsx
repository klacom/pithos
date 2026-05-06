'use client';

import { useEffect, useState } from 'react';
import InputTextField from "@/components/technical-components/InputTextField"
import FilterBy from "@/components/technical-components/FilterBy"
import SortBy from "@/components/technical-components/SortBy"
import SearchButton from "@/components/technical-components/SearchButton"
import ExtendedCardStat from "@/components/technical-components/ExtendedCardStat"
import MiniCard from "@/components/technical-components/Modals/MiniCard"

interface GatewayStats {
    balance: string;
    successRate: string;
    todayTransactions: number;
}

interface Transaction {
    id: string;
    txnId: string;
    buyerId: string;
    sellerId: string;
    amount: string;
    gateway: string;
    status: 'Completed' | 'Pending' | 'Failed';
    createdAt: string;
}

const PaymentGatewaysPage = () => {
    const [stats, setStats] = useState<{ paypal: GatewayStats; paymongo: GatewayStats } | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const iconSize = 32

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const statsRes = await fetch('/api/payments/paymongo?type=stats');
                const statsData = await statsRes.json();
                const transRes = await fetch('/api/payments/paymongo?type=transactions&limit=50');
                const transData = await transRes.json();

                if (!statsRes.ok) throw new Error(statsData.error);
                if (!transRes.ok) throw new Error(transData.error);

                setStats({
                    paypal: { balance: '₱67,000.00', successRate: '67.67%', todayTransactions: 67 },
                    paymongo: statsData,
                });

                const formattedTrans = transData.transactions.map((t: any) => ({
                    id: t.id,
                    txnId: t.txnId,
                    buyerId: t.buyer_id || 'N/A',
                    sellerId: t.seller_id || 'N/A',
                    amount: t.amount,
                    gateway: t.gateway,
                    status: t.status as 'Completed' | 'Pending' | 'Failed',
                    createdAt: new Date(t.created_at).toLocaleString(),
                }));

                setTransactions(formattedTrans);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch payment data');
                setStats({
                    paypal: { balance: '₱67,000.00', successRate: '67.67%', todayTransactions: 67 },
                    paymongo: { balance: '₱0.00', successRate: '0%', todayTransactions: 0 },
                });
                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className='flex flex-col p-4 bg-background w-full gap-4 h-full'>
            <div className="flex flex-col bg-background w-full gap-4">
                <div className="flex flex-row justify-between">
                    <h1 className='font-bold text-3xl'>Payment Gateways</h1>
                    <div className="flex flex-row gap-2 h-full items-center">
                        <SortBy sortOptions={[""]} />
                        <FilterBy filterOptions={[""]} />
                        <InputTextField placeholder="Search for users" />
                        <SearchButton />
                    </div>
                </div>
                <hr />
                {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive rounded text-destructive">
                        {error}
                    </div>
                )}
                {/* Content */}
                <div className='flex flex-col gap-4'>
                    {/* Cards */}
                    <div className="flex flex-row gap-4 w-full">
                        <ExtendedCardStat header="PayPal" subHeader="Ping 2s Ago" icon={
                            <svg className="fill-background" width={iconSize} height={iconSize} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <title>PayPal</title>
                                <path d="M15.607 4.653H8.941L6.645 19.251H1.82L4.862 0h7.995c3.754 0 6.375 2.294 6.473 5.513-.648-.478-2.105-.86-3.722-.86m6.57 5.546c0 3.41-3.01 6.853-6.958 6.853h-2.493L11.595 24H6.74l1.845-11.538h3.592c4.208 0 7.346-3.634 7.153-6.949a5.24 5.24 0 0 1 2.848 4.686M9.653 5.546h6.408c.907 0 1.942.222 2.363.541-.195 2.741-2.655 5.483-6.441 5.483H8.714Z" />
                            </svg>}
                            miniCards={
                                [
                                    <MiniCard title="Balance" header="₱67,000.00" key={1} />,
                                    <MiniCard title="Success Rate" header="67.67%" key={2} />,
                                    <MiniCard title="Today’s TX" header="67" key={3} />,
                                ]
                            }
                        />
                        <ExtendedCardStat header="PayMongo" subHeader={loading ? "Loading..." : "Ping 2s Ago"} icon={
                            <img src="/payment-logos/paymongo.png" alt="PayMongo" width={iconSize} height={iconSize} />
                        }
                            miniCards={
                                [
                                    <MiniCard title="Balance" header={stats?.paymongo?.balance || "₱0.00"} key={1} />,
                                    <MiniCard title="Success Rate" header={stats?.paymongo?.successRate || "0%"} key={2} />,
                                    <MiniCard title="Today's TX" header={String(stats?.paymongo?.todayTransactions || 0)} key={3} />,
                                ]
                            }
                        />
                    </div>

                    {/* Table */}
                    <div className="w-full p-4 bg-primary-foreground border border-muted rounded-lg">
                        <table className="*:*:*:border *:*:*:border-muted *:*:*:p-4 w-full bg-primary-foreground" border={1}>
                            <thead>
                                <tr>
                                    <td><input type="checkbox" name="" id="" /></td>
                                    <th>TXN ID</th>
                                    <th>Buyer ID</th>
                                    <th>Seller ID</th>
                                    <th>Amount</th>
                                    <th>Gateway</th>
                                    <th>Status</th>
                                    <th>Date & Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8">Loading transactions...</td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8">No transactions found</td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td><input type="checkbox" name="" id="" /></td>
                                            <td>#{tx.txnId}</td>
                                            <td>{tx.buyerId}</td>
                                            <td>{tx.sellerId}</td>
                                            <td>₱{tx.amount}</td>
                                            <td>{tx.gateway}</td>
                                            <td className={
                                                tx.status === 'Completed' ? 'text-success' :
                                                    tx.status === 'Failed' ? 'text-destructive' :
                                                        ''
                                            }>
                                                {tx.status}
                                            </td>
                                            <td>{tx.createdAt}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PaymentGatewaysPage