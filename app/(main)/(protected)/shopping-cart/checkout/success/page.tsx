"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, Download, Loader2, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import PithosLogo from "@/components/PithosLogo";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { checkTransactionStatus } from "./actions";
import { formatPrice } from "@/lib/functions";

function SuccessContent() {
    const searchParams = useSearchParams();
    const ids = searchParams.get("ids")?.split(",") || [];
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            if (ids.length === 0) {
                setLoading(false);
                return;
            }

            const result = await checkTransactionStatus(ids);
            if (result.success) {
                setTransactions(result.data || []);
            }
            setLoading(false);
        };

        fetchStatus();

        // Poll for updates if any are pending
        const interval = setInterval(async () => {
            const result = await checkTransactionStatus(ids);
            if (result.success) {
                setTransactions(result.data || []);
                const allDone = result.data?.every((tx: any) => tx.status !== 'pending');
                if (allDone) clearInterval(interval);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [searchParams]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Verifying your transaction...</p>
            </div>
        );
    }

    const allCompleted = transactions.length > 0 && transactions.every(tx => tx.status === 'completed');
    const anyFailed = transactions.some(tx => tx.status === 'failed' || tx.status === 'cancelled');
    const anyPending = transactions.some(tx => tx.status === 'pending');

    return (
        <main className="flex flex-col gap-8 min-h-[calc(100vh-200px)] mb-8 items-center justify-center py-12">
            <div className="flex flex-col w-full px-4 max-w-4xl mx-auto">
                <Card className="p-8 md:p-12 flex flex-col items-center justify-center gap-8 text-center w-full bg-primary-foreground border-muted shadow-md rounded-3xl">
                    {/* Status Icon */}
                    <div className="relative">
                        {allCompleted ? (
                            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
                                <CheckCircle className="w-20 h-20 text-green-500" />
                            </div>
                        ) : anyFailed ? (
                            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
                                <XCircle className="w-20 h-20 text-red-500" />
                            </div>
                        ) : (
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-full">
                                <Clock className="w-20 h-20 text-yellow-500 animate-pulse" />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <h1 className="font-black text-2xl md:text-3xl tracking-tight">
                            {allCompleted ? "Order Successful!" : anyFailed ? "Transaction Failed" : "Order Processing..."}
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-md">
                            {allCompleted
                                ? "Thank you for your purchase! Your assets are now ready for download. We've also sent you an email."
                                : anyFailed
                                    ? "We're sorry, but your transaction could not be completed. Please check your payment details. We've also sent you an email."
                                    : "Your order is being processed by the payment gateway. This might take a while, please don't close this page within 30 seconds. Check your email otherwise."}
                        </p>
                    </div>

                    {/* Order Details */}
                    {transactions.length > 0 && (
                        <div className="w-full bg-background/50 rounded-2xl p-6 border border-muted text-left space-y-4">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Order Summary</h3>
                            <div className="space-y-3">
                                {transactions.map((tx) => (
                                    <div key={tx.transaction_id} className="flex justify-between items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{tx.products?.product_name || "Unknown Product"}</span>
                                            <span className="text-xs font-mono text-muted-foreground">{tx.transaction_id}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="font-bold">{formatPrice(tx.products?.price || 0)}</span>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${tx.status === 'completed' ? 'bg-green-100 text-green-600' :
                                                tx.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                                    'bg-red-100 text-red-600'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
                        {allCompleted ? (
                            <Button asChild variant="red_default" size="lg" className="h-14 px-8 rounded-2xl font-bold">
                                <Link href="/buyer/account/purchase-history">
                                    <Download className="mr-2 w-5 h-5" />
                                    Download Assets
                                </Link>
                            </Button>
                        ) : anyPending ? (
                            <Button disabled variant="outline" size="lg" className="h-14 px-8 rounded-2xl font-bold opacity-50">
                                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                                Waiting for Confirmation...
                            </Button>
                        ) : (
                            <Button asChild variant="red_default" size="lg" className="h-14 px-8 rounded-2xl font-bold">
                                <Link href="/shopping-cart">
                                    <ArrowLeft className="mr-2 w-4 h-4" />
                                    Back to Cart
                                </Link>
                            </Button>
                        )}

                        <Button asChild variant="ghost" size="lg" className="h-14 px-8 rounded-2xl font-bold">
                            <Link href="/product-listing">
                                <ShoppingBag className="mr-2 w-5 h-5" />
                                Continue Shopping
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                        </Button>
                    </div>
                </Card>
            </div>
        </main>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
            <SuccessContent />
        </Suspense>
    );
}
