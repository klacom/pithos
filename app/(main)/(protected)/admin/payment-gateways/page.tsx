'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, RotateCcw, FileText, ToggleRight } from 'lucide-react';

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
    totalVolume: string;
    transactionFeeTotal: string;
    failedCount: number;
    averageTransaction: string;
    peakTime: string;
}

interface Transaction {
    id: string;
    txnId: string;
    buyerId: string;
    sellerId: string;
    amount: string;
    paymentMethod: string;
    gateway: string;
    status: 'Completed' | 'Pending' | 'Failed' | 'Cancelled';
    createdAt: string;
}

export default function PayMongoAdminDashboard() {
    const [expandedSections, setExpandedSections] = useState({
        configuration: false,
        analytics: false,
        actions: false,
    });

    // Mock data
    const config: PayMongoConfig = {
        publicKeyStatus: 'Valid',
        secretKeyStatus: 'Valid',
        webhookStatus: 'Active',
        supportedMethods: ['Credit Card', 'Debit Card', 'GCash', 'GrabPay', 'Bank Transfer'],
        merchantName: 'Your Business Name',
        merchantEmail: 'merchant@business.com',
        settlementAccount: 'BDO - ****1234',
    };

    const analytics: AnalyticsMetrics = {
        totalVolume: '₱1,250,000.00',
        transactionFeeTotal: '₱31,250.00',
        failedCount: 12,
        averageTransaction: '₱5,208.33',
        peakTime: '2:00 PM - 3:00 PM',
    };

    const transactions: Transaction[] = [
        {
            id: '1',
            txnId: 'pay_123456',
            buyerId: 'buyer_001',
            sellerId: 'seller_001',
            amount: '₱2,500.00',
            paymentMethod: 'GCash',
            gateway: 'PayMongo',
            status: 'Completed',
            createdAt: '2024-01-15 10:30 AM',
        },
        // Add more mock transactions
    ];

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-800';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Failed':
                return 'bg-red-100 text-red-800';
            case 'Cancelled':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getKeyStatusColor = (status: string) => {
        switch (status) {
            case 'Valid':
                return 'bg-green-100 text-green-800';
            case 'Invalid':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const getWebhookStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-800';
            case 'Inactive':
                return 'bg-gray-100 text-gray-800';
            case 'Error':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (

        <div className="flex flex-col p-4 bg-background w-full gap-4 min-h-0 h-full overflow-y-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">PayMongo</h1>
                <p className="text-muted-foreground mt-1">Payment Gateway Management & Analytics</p>
            </div>

            {/* Gateway Status Card */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold">Gateway Status</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                                Live
                            </span>
                            <span className="text-sm text-muted-foreground">Latency: 45ms</span>
                        </div>
                    </div>
                </div>

                {/* Mini Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Balance Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-blue-600 font-medium">Account Balance</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">₱45,230.50</p>
                        <p className="text-xs text-blue-600 mt-2">Last updated: 5 mins ago</p>
                    </div>

                    {/* Success Rate Card */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-green-600 font-medium">Success Rate</p>
                        <p className="text-2xl font-bold text-green-900 mt-1">98.5%</p>
                        <p className="text-xs text-green-600 mt-2">Out of 1,234 transactions</p>
                    </div>

                    {/* Today's Transactions Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                        <p className="text-sm text-purple-600 font-medium">Today's Transactions</p>
                        <p className="text-2xl font-bold text-purple-900 mt-1">267</p>
                        <p className="text-xs text-purple-600 mt-2">Total: ₱1,234,567.89</p>
                    </div>
                </div>
            </div>

            {/* Configuration Section */}
            <div className="bg-white rounded-lg border shadow-sm">
                <button
                    onClick={() => toggleSection('configuration')}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
                >
                    <h3 className="text-lg font-semibold">Configuration</h3>
                    {expandedSections.configuration ? (
                        <ChevronUp className="w-5 h-5" />
                    ) : (
                        <ChevronDown className="w-5 h-5" />
                    )}
                </button>

                {expandedSections.configuration && (
                    <div className="border-t px-6 py-4 space-y-6">
                        {/* API Keys Status */}
                        <div>
                            <h4 className="font-semibold text-sm mb-3">API Key Status</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm">Public Key</span>
                                    <span className={`px-3 py-1 rounded text-sm font-medium ${getKeyStatusColor(config.publicKeyStatus)}`}>
                                        {config.publicKeyStatus}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm">Secret Key</span>
                                    <span className={`px-3 py-1 rounded text-sm font-medium ${getKeyStatusColor(config.secretKeyStatus)}`}>
                                        {config.secretKeyStatus}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Webhook Configuration */}
                        <div>
                            <h4 className="font-semibold text-sm mb-3">Webhook Configuration</h4>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm">Webhook Status</span>
                                <span className={`px-3 py-1 rounded text-sm font-medium ${getWebhookStatusColor(config.webhookStatus)}`}>
                                    {config.webhookStatus}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Endpoint: https://your-domain.com/webhooks/paymongo</p>
                        </div>

                        {/* Supported Payment Methods */}
                        <div>
                            <h4 className="font-semibold text-sm mb-3">Supported Payment Methods</h4>
                            <div className="flex flex-wrap gap-2">
                                {config.supportedMethods.map((method) => (
                                    <span key={method} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                        {method}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Merchant Account Details */}
                        <div>
                            <h4 className="font-semibold text-sm mb-3">Merchant Account Details</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-muted-foreground">Merchant Name</span>
                                    <span className="text-sm font-medium">{config.merchantName}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-muted-foreground">Merchant Email</span>
                                    <span className="text-sm font-medium">{config.merchantEmail}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-muted-foreground">Settlement Account</span>
                                    <span className="text-sm font-medium">{config.settlementAccount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Analytics & Metrics Section */}
            <div className="bg-white rounded-lg border shadow-sm">
                <button
                    onClick={() => toggleSection('analytics')}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
                >
                    <h3 className="text-lg font-semibold">Analytics & Metrics</h3>
                    {expandedSections.analytics ? (
                        <ChevronUp className="w-5 h-5" />
                    ) : (
                        <ChevronDown className="w-5 h-5" />
                    )}
                </button>

                {expandedSections.analytics && (
                    <div className="border-t px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Total Volume */}
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <p className="text-xs font-medium text-blue-600 uppercase">Total Volume</p>
                                <p className="text-xl font-bold text-blue-900 mt-2">{analytics.totalVolume}</p>
                            </div>

                            {/* Transaction Fees */}
                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                <p className="text-xs font-medium text-purple-600 uppercase">Transaction Fees</p>
                                <p className="text-xl font-bold text-purple-900 mt-2">{analytics.transactionFeeTotal}</p>
                            </div>

                            {/* Failed Count */}
                            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                <p className="text-xs font-medium text-red-600 uppercase">Failed Transactions</p>
                                <p className="text-xl font-bold text-red-900 mt-2">{analytics.failedCount}</p>
                            </div>

                            {/* Average Transaction */}
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <p className="text-xs font-medium text-green-600 uppercase">Avg. Transaction</p>
                                <p className="text-xl font-bold text-green-900 mt-2">{analytics.averageTransaction}</p>
                            </div>

                            {/* Peak Time */}
                            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                <p className="text-xs font-medium text-yellow-600 uppercase">Peak Time</p>
                                <p className="text-xl font-bold text-yellow-900 mt-2">{analytics.peakTime}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions Section */}
            <div className="bg-white rounded-lg border shadow-sm">
                <button
                    onClick={() => toggleSection('actions')}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
                >
                    <h3 className="text-lg font-semibold">Actions</h3>
                    {expandedSections.actions ? (
                        <ChevronUp className="w-5 h-5" />
                    ) : (
                        <ChevronDown className="w-5 h-5" />
                    )}
                </button>

                {expandedSections.actions && (
                    <div className="border-t px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                            <button className="flex items-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition">
                                <Eye className="w-4 h-4" />
                                View Details
                            </button>
                            <button className="flex items-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition">
                                <RotateCcw className="w-4 h-4" />
                                Refund
                            </button>
                            <button className="flex items-center gap-2 px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition">
                                <FileText className="w-4 h-4" />
                                Settlement Report
                            </button>
                            <button className="flex items-center gap-2 px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg font-medium transition">
                                <ToggleRight className="w-4 h-4" />
                                Test Mode
                            </button>
                            <button className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition">
                                <FileText className="w-4 h-4" />
                                Webhook Logs
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Recent Transactions</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Transaction ID</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Buyer</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Seller</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Amount</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Payment Method</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Status</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Date & Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((txn) => (
                                <tr key={txn.id} className="border-b hover:bg-gray-50 transition">
                                    <td className="px-6 py-3 text-sm font-mono">{txn.txnId}</td>
                                    <td className="px-6 py-3 text-sm text-muted-foreground">{txn.buyerId}</td>
                                    <td className="px-6 py-3 text-sm text-muted-foreground">{txn.sellerId}</td>
                                    <td className="px-6 py-3 text-sm font-medium">{txn.amount}</td>
                                    <td className="px-6 py-3 text-sm">
                                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                                            {txn.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(txn.status)}`}>
                                            {txn.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-muted-foreground">{txn.createdAt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    );
}
