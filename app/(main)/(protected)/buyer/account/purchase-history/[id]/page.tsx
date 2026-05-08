"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Package } from "lucide-react";
import Link from "next/link";
import { getTransactionById } from "../../actions";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Transaction {
    transaction_id: string;
    buyer_id: string;
    product_id: string;
    created_at: string;
    status: string;
    products: {
        product_name: string;
        name?: string;
        price: number;
        seller_owner_id: {
            id: string;
            user_fullname: string;
            user_email: string;
        };
        [key: string]: any;
    };
}

export default function OrderDetailsPage() {
    const params = useParams();
    const orderId = params.id as string;
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransaction = async () => {
            setLoading(true);
            try {
                const result = await getTransactionById(orderId);
                if (result.success) {
                    setTransaction(result.data);
                } else {
                    toast.error(result.error || "Failed to load order details");
                }
            } catch (error) {
                toast.error("An error occurred while loading order details");
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchTransaction();
        }
    }, [orderId]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(price);
    };

    const getStatusBadge = (status: string) => {
        const lowerStatus = status.toLowerCase();
        let variant = "default";
        let className = "";

        switch (lowerStatus) {
            case 'completed':
                className = "bg-green-600 hover:bg-green-700";
                break;
            case 'pending':
                className = "bg-yellow-600 hover:bg-yellow-700";
                break;
            case 'refunded':
                className = "bg-blue-600 hover:bg-blue-700";
                break;
            case 'cancelled':
                className = "bg-red-600 hover:bg-red-700";
                break;
            default:
                className = "bg-gray-600 hover:bg-gray-700";
        }

        return (
            <Badge variant="default" className={className}>
                {status}
            </Badge>
        );
    };

    const handleDownload = async () => {
        if (!transaction?.product_id) return;

        try {
            const res = await fetch(`/api/product/${transaction.product_id}/download`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            const a = document.createElement('a');
            a.href = data.downloadUrl;
            a.download = data.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success("Download started!");
        } catch (err: any) {
            console.error("Download failed:", err);
            toast.error(err.message || "Failed to download asset.");
        }
    };

    if (loading) {
        return (
            <div className='flex flex-col p-4 bg-background w-full gap-8 overflow-y-auto'>
                <div className='flex flex-col gap-2'>
                    <h1 className='font-bold text-3xl'>Order Details</h1>
                </div>
                <div className="flex justify-center items-center py-12">
                    <p className="text-muted-foreground">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className='flex flex-col p-4 bg-background w-full gap-8 overflow-y-auto'>
                <div className='flex flex-col gap-2'>
                    <Link href="/buyer/account/purchase-history" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Purchase History</span>
                    </Link>
                    <h1 className='font-bold text-3xl'>Order Not Found</h1>
                    <p className='text-muted-foreground'>The order you're looking for doesn't exist or you don't have access to it.</p>
                </div>
            </div>
        );
    }

    const { user } = useAuth();
    const product = transaction.products;
    const price = product?.price || 0;
    const platformFee = price * 0.3;
    const total = price;
    const vendorName = product?.seller_owner_id?.user_fullname || product?.seller_owner_id?.user_email?.split('@')[0] || 'Unknown Vendor';

    return (
        <div className='flex flex-col p-4 bg-background w-full gap-8 overflow-y-auto'>
            <div className='flex flex-col gap-2'>
                <Link href="/buyer/account/purchase-history" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Purchase History</span>
                </Link>
                <h1 className='font-bold text-3xl'>Order Details</h1>
                <p className='text-muted-foreground'>Order ID: {transaction.transaction_id}</p>
            </div>
            <hr />

            <div className="flex flex-col gap-6">
                <Card className="w-full p-6 bg-primary-foreground border-muted">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-muted">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <h2 className="font-semibold text-xl">Order Status</h2>
                                {getStatusBadge(transaction.status)}
                            </div>
                            <p className="text-muted-foreground">Placed on {formatDate(transaction.created_at)}</p>
                        </div>
                        <Button variant="red_default">
                            <Download className="w-4 h-4 mr-2" />
                            Download Invoice
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-lg">Billing Information</h3>
                            <p className="text-muted-foreground">{user?.user_metadata?.full_name || 'User'}</p>
                            <p className="text-muted-foreground">{user?.email || 'No email'}</p>
                            <p className="text-muted-foreground">--</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-lg">Payment Details</h3>
                            <p className="text-muted-foreground">Transaction ID: {transaction.transaction_id}</p>
                        </div>
                    </div>
                </Card>

                <Card className="w-full p-6 bg-primary-foreground border-muted">
                    <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Items Purchased
                    </h3>

                    <div className="border border-muted rounded-lg overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 p-4 bg-muted/30 font-medium text-sm">
                            <div className="col-span-6">Product</div>
                            <div className="col-span-2 text-center">Seller</div>
                            <div className="col-span-2 text-center">License</div>
                            <div className="col-span-2 text-right">Price</div>
                        </div>

                        <div className="grid grid-cols-12 gap-4 p-4 items-center border-t border-muted">
                            <div className="col-span-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                        <Package className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">{product?.product_name || product?.name || 'Unknown Product'}</h4>
                                        <p className="text-muted-foreground text-sm">Digital Asset</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2 text-center text-muted-foreground">{vendorName}</div>
                            <div className="col-span-2 text-center text-muted-foreground">Standard</div>
                            <div className="col-span-2 text-right font-semibold">{formatPrice(price)}</div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-muted">
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex justify-between w-full max-w-xs text-muted-foreground">
                                <span>Subtotal</span>
                                <span>{formatPrice(price)}</span>
                            </div>
                            <div className="flex justify-between w-full max-w-xs text-muted-foreground">
                                <span>Platform Fee (20%)</span>
                                <span>{formatPrice(platformFee)}</span>
                            </div>
                            <div className="flex justify-between w-full max-w-xl font-semibold text-lg pt-2 border-t border-muted">
                                <span>Total Paid</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="w-full p-6 bg-primary-foreground border-muted">
                    <h3 className="font-semibold text-xl mb-4">Download Your Assets</h3>
                    <p className="text-muted-foreground mb-4">Your purchased assets are available for download below.</p>
                    <Button
                        variant="red_default"
                        className="w-full md:w-auto"
                        onClick={handleDownload}
                        disabled={transaction.status.toLowerCase() !== 'completed'}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download All Files
                    </Button>
                </Card>
            </div>
        </div>
    );
}
