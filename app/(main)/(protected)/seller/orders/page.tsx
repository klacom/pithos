"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useDataTable } from "@/app/hooks/useDataTable";
import { DataTable } from "@/components/technical-components/DataTable";
import { capitalizeFirstLetter, formatDate, formatPrice, getStatusColor } from "@/lib/functions";
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
            buyer_id,
            product_id,
            created_at,
            status,
            products!inner(
                product_name,
                price
            )
        `,
        searchableColumns: [
            "products.product_name"
        ],
        baseFilters: userId 
            ? {seller_id : userId}
            : undefined
    });

    const columns = [
        {
            key: "transaction_id",
            label: "Transaction ID",
            sortable: true,
            render: (value: string) => (
                <span className="font-mono text-sm">{value}</span>
            )
        },
        {
            key: "buyer_id",
            label: "Buyer ID",
            sortable: true,
            render: (value: string) => (
                <span className="font-mono text-sm">{value}</span>
            )
        },
        {
            key: "products.product_name",
            label: "Product Name",
            render: (value: string) => (
                <span className="text-sm">{value}</span>
            )
        },
        {
            key: "created_at",
            label: "Created At",
            sortable: true,
            render: (value: string) => formatDate(value)
        },
        {
            key: "products.price",
            label: "Amount",
            sortable: true,
            render: (_: any, row: any) =>
                formatPrice(row.products?.price || 0)
        },
        {
            key: "status",
            label: "Status",
            filterable : true,
            render: (value: string) => (
                <span className={getStatusColor(value)}>
                    {capitalizeFirstLetter(value)}
                </span>
            )
        },
        {
            key: "actions",
            label: "Actions",
            render: (_: any, row: any) => (
                // /buyer/account / purchase - history / ${ row.transaction_id }
                <Link href={``}>
                    <Button variant="default" className="text-xs">
                        View Details
                    </Button>
                </Link>
            )
        }
    ];

    return (
        <div className="flex flex-col p-4 bg-background w-full gap-4 h-full justify-between overflow-y-auto">

            <div className="flex flex-col w-full gap-4 h-full">

                {/* Header */}
                <div className="flex flex-row justify-between">
                    <h1 className="font-bold text-3xl">Your Orders</h1>
                </div>

                <hr />

                {/* Table */}
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

            <p className="text-muted-foreground self-center mt-4">
                <i>
                    Pithos has a commission percentage of 30/70, whereas 30% goes to Pithos and 70% goes to sellers.
                </i>{" "}
                <Link href="#" className="text-medium text-accent">
                    Learn More
                </Link>
            </p>

        </div>
    );
};

export default page;