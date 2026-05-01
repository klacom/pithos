"use client";

import { useState, useEffect } from "react";
import FilterBy from "@/components/technical-components/FilterBy"
import SortBy from "@/components/technical-components/SortBy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { getBuyerTransactions } from "../actions"
import { toast } from "sonner"

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

const page = () => {
    const [searchContent, setSearchContent] = useState("");
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                const result = await getBuyerTransactions();
                if (result.success) {
                    setTransactions(result.data || []);
                } else {
                    toast.error(result.error || "Failed to load purchase history");
                }
            } catch (error) {
                toast.error("An error occurred while loading purchase history");
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(price);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'text-green-500';
            case 'pending':
                return 'text-yellow-500';
            case 'refunded':
                return 'text-blue-500';
            case 'cancelled':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    return (
        <div className='flex flex-col p-4 bg-background w-full gap-4 h-full justify-between overflow-y-auto'>
            <div className="flex flex-col bg-background w-full gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className='font-bold text-3xl'>Purchase History</h1>
                    <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
                        <div className="flex items-center h-10">
                            <Input 
                                placeholder="Search orders..." 
                                className="rounded-r-none h-full w-64" 
                                value={searchContent}
                                onChange={(e) => setSearchContent(e.target.value)}
                            />
                            <Button 
                                variant="red_default" 
                                className="rounded-l-none h-full" 
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                        <SortBy sortOptions={["Date", "Amount", "Status"]} />
                        <FilterBy filterOptions={["All", "Pending", "Completed", "Refunded", "Cancelled"]} />
                    </div>
                </div>
                <hr />
                <div className='flex flex-col gap-4 h-full'>

                    <div className="w-full p-4 bg-primary-foreground border border-muted rounded-lg flex-1 flex flex-col justify-between">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <p className="text-muted-foreground">Loading purchase history...</p>
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="flex flex-col justify-center items-center py-12 gap-4">
                                <p className="text-muted-foreground">No purchase history found</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="*:*:*:border *:*:*:border-muted *:*:*:p-4 w-full bg-primary-foreground" border={1}>
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Order Date</th>
                                                <th>Product Name</th>
                                                <th>Vendor</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((transaction) => {
                                                const vendorName = transaction.products?.seller_owner_id?.user_fullname || transaction.products?.seller_owner_id?.user_email?.split('@')[0] || 'Unknown Vendor';
                                                return (
                                                    <tr key={transaction.transaction_id}>
                                                        <td className="font-mono">{transaction.transaction_id}</td>
                                                        <td>{formatDate(transaction.created_at)}</td>
                                                        <td>{transaction.products?.product_name || transaction.products?.name || 'Unknown Product'}</td>
                                                        <td>{vendorName}</td>
                                                        <td>{formatPrice(transaction.products?.price || 0)}</td>
                                                        <td className={getStatusColor(transaction.status)}>{transaction.status}</td>
                                                        <td>
                                                            <Link href={`/buyer/account/purchase-history/${transaction.transaction_id}`}>
                                                                <Button variant="link" className="text-red-500 hover:text-red-600 px-0">
                                                                    View Details
                                                                </Button>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex items-center justify-between px-2 pt-4 mt-4 border-t border-muted">
                                    <p className="text-sm text-muted-foreground">
                                        Showing <span className="font-medium text-foreground">1</span> to{' '}
                                        <span className="font-medium text-foreground">{transactions.length}</span> of{' '}
                                        <span className="font-medium text-foreground">{transactions.length}</span> results
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default page
