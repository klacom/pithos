'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Eye, RotateCcw, FileText, ToggleRight, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PayMongoConfig {
    publicKeyStatus: 'Valid' | 'Invalid' | 'Missing';
    secretKeyStatus: 'Valid' | 'Invalid' | 'Missing';
    webhookStatus: 'Active' | 'Inactive' | 'Error';
    supportedMethods: string[];
    merchantName: string;
    merchantEmail: string;
    settlementAccount: string;
}

interface AnalyticsMetrics {
    balance: string;
    successRate: string;
    todayTransactions: number;
    totalTransactions: number;
    failedCount: number;
}

interface Transaction {
    id: string;
    txnId: string;
    amount: string;
    currency: string;
    status: 'Completed' | 'Pending' | 'Failed' | 'Cancelled';
    created_at: number;
    description: string;
    gateway: string;
}

interface PayMongoStats extends AnalyticsMetrics {
    keyStatus: {
        publicKey: string
        secretKey: string
        status: string
    }
    webhookStatus: 'Active' | 'Inactive' | 'Error'
    webhookUrl: string
}

export default function PayMongoAdminDashboard() {
    const [expandedSections, setExpandedSections] = useState({
        configuration: false,
        analytics: true,
        actions: false,
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<PayMongoStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [statsRes, txRes] = await Promise.all([
                fetch('/api/payments/paymongo?type=stats'),
                fetch('/api/payments/paymongo?type=transactions&limit=10')
            ]);

            if (!statsRes.ok || !txRes.ok) throw new Error('Failed to fetch data');

            const statsData = await statsRes.json();
            const txData = await txRes.json();

            setStats(statsData);
            setTransactions(txData.transactions);
        } catch (error) {
            console.error('Dashboard error:', error);
            toast.error('Failed to load PayMongo data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const getKeyStatusColor = (status: string) => {
        switch (status) {
            case 'Valid': return 'bg-green-100 text-green-800';
            case 'Invalid': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'text-green-800';
            case 'Pending': return 'text-yellow-800';
            case 'Failed': return 'text-red-800';
            default: return 'text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-background w-full">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Syncing with PayMongo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col p-6 bg-background w-full gap-6 min-h-0 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">PayMongo Management</h1>
                    <p className="text-muted-foreground mt-1">Real-time gateway monitoring and transaction history.</p>
                </div>
                <button
                    onClick={() => fetchData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Gateway Status Card */}
            <div className="bg-card rounded-xl border shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold">Gateway Health</h2>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-green-600 text-sm font-semibold">
                                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                                Live Test Mode
                            </span>
                            <span className="text-sm text-muted-foreground">Response time: 42ms</span>
                        </div>
                    </div>
                </div>

                {/* Mini Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-xl p-6 border bg-background">
                        <p className="text-sm font-bold uppercase tracking-wider">Account Balance</p>
                        <p className="text-3xl text-accent font-black mt-2">{stats?.balance || '₱0.00'}</p>
                        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Updated just now
                        </p>
                    </div>

                    <div className="rounded-xl p-6 border bg-background">
                        <p className="text-sm font-bold uppercase tracking-wider">Success Rate</p>
                        <p className="text-3xl font-black text-accent mt-2">{stats?.successRate || '0.00%'}</p>
                        <p className="text-xs text-muted-foreground mt-3">Out of {stats?.totalTransactions} attempts</p>
                    </div>

                    <div className="rounded-xl p-6 border bg-background">
                        <p className="text-sm font-bold uppercase tracking-wider">Total Sales</p>
                        <p className="text-3xl font-black text-accent mt-2">{stats?.totalTransactions || 0}</p>
                        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {stats?.failedCount} failed attempts
                        </p>
                    </div>
                </div>
            </div>

            {/* Configuration Section */}
            <div className="bg-card rounded-xl border shadow-sm ">
                <button
                    onClick={() => toggleSection('configuration')}
                    className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                            <ToggleRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-bold">API Configuration</h3>
                    </div>
                    {expandedSections.configuration ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedSections.configuration && (
                    <div className="p-8 border-t bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Key Status</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                                    <span className="text-sm font-medium">Public Key</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getKeyStatusColor(stats?.keyStatus.publicKey || 'Missing')}`}>
                                        {stats?.keyStatus.publicKey.toUpperCase() || 'MISSING'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                                    <span className="text-sm font-medium">Secret Key</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getKeyStatusColor(stats?.keyStatus.secretKey || 'Missing')}`}>
                                        {stats?.keyStatus.secretKey.toUpperCase() || 'MISSING'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Webhook Status</h4>
                            <div className="p-4 bg-background rounded-lg border space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Status</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${stats?.webhookStatus === 'Active' ? 'bg-blue-500/10 text-blue-600' : 'bg-red-500/10 text-red-600'}`}>
                                        {stats?.webhookStatus.toUpperCase() || 'INACTIVE'}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground font-mono truncate">
                                    URL: {stats?.webhookUrl || 'Not set'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Transactions Table */}
            <div className="bg-card rounded-xl border shadow-sm  mb-8">
                <div className="p-6 border-b flex items-center justify-between">
                    <h3 className="text-lg font-bold">Recent PayMongo Transactions</h3>
                    <button className="text-sm text-primary font-bold hover:underline">View All</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 text-muted-foreground font-bold">
                                <th className="px-6 py-4 text-left">REFERENCE</th>
                                <th className="px-6 py-4 text-left">DATE</th>
                                <th className="px-6 py-4 text-left">DESCRIPTION</th>
                                <th className="px-6 py-4 text-right">AMOUNT</th>
                                <th className="px-6 py-4 text-center">STATUS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {transactions.length > 0 ? (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-muted/30 transition">
                                        <td className="px-6 py-4 font-mono font-medium text-xs">{tx.txnId}</td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(tx.created_at * 1000).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium">{tx.description}</td>
                                        <td className="px-6 py-4 text-right font-bold">₱{parseFloat(tx.amount).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 text-xs font-bold ${getStatusColor(tx.status)}`}>
                                                {tx.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        No recent transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
