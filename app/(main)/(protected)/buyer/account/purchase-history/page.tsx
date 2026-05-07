"use client";

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useDataTable } from "@/app/hooks/useDataTable";
import { DataTable } from "@/components/technical-components/DataTable";
import { formatDate, capitalizeFirstLetter, formatPrice, getStatusColor } from "@/lib/functions";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, Suspense } from "react";

const page = () => {

    const supabase = createClient();

    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUserId(data.user?.id || null);
        };

        getUser();
    }, []);

    const {
        data,
        total,
        page,
        setPage,
        q,
        setQ,
        debouncedQ,
        setDebouncedQ,
        sort,
        setSort,
        order,
        setOrder,
        filter,
        setFilter,
        doesSearchableColumnsExist
    } = useDataTable("transactions", {
        enabled: !!userId,
        select: `
        transaction_id,
        created_at,
        status,
        products!inner(
            product_name,
            price,
            seller: seller_owner_id(
                user_fullname,
                user_email
            )
        )
    `,
        searchableColumns: [
            "products.product_name",
        ],
        baseFilters: userId
            ? { buyer_id: userId }
            : undefined
    });

    const columns = [
        {
            key: "transaction_id",
            label: "Order ID",
            sortable: true,
            searchable: false,
            render: (value: string) => (
                <span className="font-mono">{value}</span>
            )
        },
        {
            key: "created_at",
            label: "Order Date",
            sortable: true,
            render: (value: string) => formatDate(value)
        },
        {
            key: "products.product_name",
            label: "Product Name",
            sortable: false,
            searchable: true,
            render: (_: any, row: any) =>
                row.products?.product_name ||
                row.products?.name ||
                "Unknown Product"
        },
        {
            key: "products.seller.user_fullname",
            label: "Vendor",
            searchable: true,
            render: (_: any, row: any) => {
                const vendor =
                    row.products?.seller?.user_fullname ||
                    row.products?.seller?.user_email?.split("@")[0];

                return vendor || "Unknown Vendor";
            }
        },
        {
            key: "products.price",
            label: "Amount",
            sortable: true,
            render: (value: number) => formatPrice(value || 0)
        },
        {
            key: "status",
            label: "Status",
            filterable: true,
            render: (value: string) => (
                <span className={getStatusColor(value)}>
                    {capitalizeFirstLetter(value)}
                </span>
            )
        },
        {
            key: "actions",
            label: "Actions",
            render: (_: any, row: any) => {
                const isCompleted = row.status === 'completed';
                const productId = row.products?.product_id;

                const handleDownload = async () => {
                    if (!productId) return;

                    try {
                        const res = await fetch(`/api/products/${productId}/download`);
                        const data = await res.json();

                        if (!res.ok) throw new Error(data.error);

                        const a = document.createElement('a');
                        a.href = data.downloadUrl;
                        a.download = data.fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    } catch (err: any) {
                        console.error("Download failed:", err);
                        alert(err.message || "Failed to download asset.");
                    }
                };

                return (
                    <div className="flex flex-row gap-2 w-full justify-center">
                        <Link href={`/buyer/account/purchase-history/${row.transaction_id}`}>
                            <Button variant="outline" size="sm">
                                View Details
                            </Button>
                        </Link>
                        {isCompleted && (
                            <Button
                                variant={"red_default"}
                                size="sm"
                                onClick={handleDownload}
                            >
                                Download
                            </Button>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <div className='flex flex-col p-4 bg-background w-full gap-4 h-full justify-between overflow-y-auto'>

            <div className="flex flex-col bg-background w-full gap-4 h-full">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className='font-bold text-3xl'>Purchase History</h1>
                </div>

                <hr />

                {/* Content */}
                <div className='flex flex-col gap-4 h-full'>

                    <div className="w-full p-4 bg-primary-foreground border border-muted rounded-lg flex-1 flex flex-col justify-between h-full">

                        <Suspense>
                            <DataTable
                                entity="transactions"
                                columns={columns}
                                data={data}
                                total={total}
                                page={page}
                                setPage={setPage}
                                q={q}
                                setQ={setQ}
                                debouncedQ={debouncedQ}
                                setDebouncedQ={setDebouncedQ}
                                sort={sort}
                                setSort={setSort}
                                order={order}
                                setOrder={setOrder}
                                filter={filter}
                                setFilter={setFilter}
                                loading={!data}
                                doesSearchableColumnsExist={doesSearchableColumnsExist}
                            />
                        </Suspense>

                    </div>
                </div>

            </div>
        </div>
    )
}

export default page
