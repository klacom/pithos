"use client";

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@deemlol/next-icons";
import Tabs from "@/components/ui/tabs";
import { JSX } from "react";
import { DataTable } from "@/components/technical-components/DataTable";
import { useDataTable } from "@/app/hooks/useDataTable";
import { Suspense } from "react";
import { toast } from "sonner";
import { unlockUser } from "./actions";
import { formatDate } from "@/lib/functions";
import { capitalizeFirstLetter } from "@/lib/functions";
import { useMemo } from "react";

// User Table Types
type User = {
    id: string
    created_at: string
    user_email: string
    user_role: string
    login_attempts: number
    is_locked: boolean
    user_fullname: string
}

type Transaction = {
    transaction_id: string
    buyer_id: string
    product_id: string
    created_at: string
    status: string
}

type Reviews = {
    review_id : string
    review_description : string
    reviewer_id : string
    created_at : string
    product_id : string
    rating : number
}

const ActionButtons = (
    {
        row,
        table,
        setPageTitle,
        setSelectedUser
    }: any) => {
    const [isUnlocking, setIsUnlocking] = useState(false);

    return (
        <div className="flex flex-row gap-2 w-full justify-center">
            <Button
                variant={'default'}
                size="sm"
                onClick={() => {
                    if (row.user_role === "admin") return;
                    // TODO: open detail page depending on row.role
                    setSelectedUser(row);
                    setPageTitle(`View ${capitalizeFirstLetter(row.user_role)} Details`);
                }}
            >
                View Details
            </Button>

            <Button
                variant={'red_default'}
                size="sm"
                disabled={!row.is_locked || isUnlocking}
                onClick={async () => {
                    setIsUnlocking(true);
                    try {
                        const result = await unlockUser(row.id);

                        if (!result.success) {
                            toast.error("Failed to unlock user: " + result.error);
                        } else {
                            await table.refresh();
                            toast.success("User account unlocked successfully!");
                        }
                    } catch (error: any) {
                        toast.error("An error occurred: " + error.message);
                    } finally {
                        setIsUnlocking(false);
                    }
                }}
            >
                {isUnlocking ? "Unlocking..." : "Unlock"}
            </Button>
        </div>
    );
}

const Page = () => {

    // States

    // Table
    const [pageTitle, setPageTitle] = useState("Manage Users");

    // User Details
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Table for Users (General)
    const table = useDataTable("users", {
        searchableColumns: [
            "user_email",
            "user_fullname"
        ],
        enabled : true
    })

    // memoized
    const bTxBaseFilters = useMemo(() => {
        if (!selectedUser?.id) return undefined;
        return { buyer_id: selectedUser.id };
    }, [selectedUser?.id]);

    // Table for Buyer Transactions
    const bTxTable = useDataTable("transactions", {
        // searchableColumns: [
        //     "transaction_id",
        // ],
        baseFilters : bTxBaseFilters,
        enabled: !!selectedUser?.id,
    })

    // Memoization Revierws
    const bRvwsBaseFilters = useMemo(() => {
        if (!selectedUser?.id) return undefined;
        return { reviewer_id: selectedUser.id };
    }, [selectedUser?.id]);

    // Table for Buyer Reviews
    const bRvwsTable = useDataTable("reviews", {
        searchableColumns : [
            "review_description"
        ],
        baseFilters: bRvwsBaseFilters,
        enabled: !!selectedUser?.id,
    })

    // Table for Buyer Reviews

// ===============================================================================================================================

    return (
        <div className='flex flex-col p-4 bg-background w-full gap-4'>
            {/* Header */}
            <div className="flex flex-row justify-between">
                <h1 className='font-bold text-3xl'>{pageTitle}</h1>
                <div className="flex flex-row gap-2 h-full items-center">

                </div>
            </div>

            <hr />

            {/* Content */}
            <div className='flex gap-4 h-full'>

                {/* Users Data Table */}
                {!selectedUser && (
                    <Suspense fallback={<div className="animate-pulse w-full h-full">Loading...</div>}>
                        <div className={`w-full h-full`}>
                            <DataTable<User>
                                {...table}
                                columns={[
                                    {
                                        key: "id", label: "User ID", sortable: true, render: (_: any, row: any) => (
                                            <p className="font-mono text-xs">{row.id}</p>
                                        )
                                    },
                                    {
                                        key: "created_at", label: "Joined At", sortable: true, render: (_: any, row: any) => (
                                            <p>{formatDate(row.created_at)}</p>
                                        )
                                    },
                                    {
                                        key: "user_email", label: "Email", sortable: true, searchable: true, render: (_: any, row: any) => (
                                            <p className="font-mono text-xs">{row.user_email}</p>
                                        )
                                    },
                                    { key: "user_role", label: "Role", filterable: true },
                                    { key: "login_attempts", label: "Log. Count" },
                                    {
                                        key: "is_locked", label: "Status", filterable: true, render: (_: any, row: any) => (
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.is_locked
                                                ? "text-red-600"
                                                : "text-green-600"
                                                }`}>
                                                {row.is_locked ? "Locked" : "Active"}
                                            </span>
                                        )
                                    },
                                    { key: "user_fullname", label: "Full Name", sortable: true, searchable: true },
                                    {
                                        key: "role", label: "Actions", sortable: false, render: (_: any, row: any) => <ActionButtons
                                            row={row}
                                            table={table}
                                            setSelectedUser={setSelectedUser}
                                            setPageTitle={setPageTitle}
                                        />
                                    },
                                ]}
                            />
                        </div>
                    </Suspense>
                )}
                

                {selectedUser && (
                    <div className="flex w-full gap-4">

                        {/* Sidebar */}
                        <div className="flex flex-col gap-4 bg-primary-foreground border border-muted rounded-lg p-4 w-3/12">
                            <Button
                                variant={'red_ghost'}
                                className="w-fit"
                                onClick={() => setSelectedUser(null)}
                            >
                                <ArrowLeft /> Go Back to Users
                            </Button>
                            <div>
                                <p className="text-muted-foreground">User ID</p>
                                <p className="font-semibold">{selectedUser.id}</p>
                            </div>

                            <div>
                                <p className="text-muted-foreground">Full Name</p>
                                <p className="font-semibold">{selectedUser.user_fullname}</p>
                            </div>

                            <div>
                                <p className="text-muted-foreground">Email</p>
                                <p className="font-semibold">{selectedUser.user_email}</p>
                            </div>

                            <div>
                                <p className="text-muted-foreground">Role</p>
                                <p className="font-semibold">{capitalizeFirstLetter(selectedUser.user_role)}</p>
                            </div>

                            <div>
                                <p className="text-muted-foreground">Joined At</p>
                                <p className="font-semibold">{capitalizeFirstLetter(selectedUser.created_at)}</p>
                            </div>

                            <div>
                                <p className="text-muted-foreground">Status</p>
                                <p className="font-semibold">{selectedUser.is_locked ? "Locked" : "Active"}</p>
                            </div>

                        </div>

                        {/* Content */}
                        <div className="bg-primary-foreground border border-muted rounded-lg p-4 w-9/12 relative flex-col">

                            {/* Buyer Content */}
                            {selectedUser.user_role === "buyer" && (
                                <Tabs items={[
                                    {
                                        label: "Transactions",
                                        content : (
                                            <Suspense fallback={<div className="animate-pulse w-full h-full">Loading...</div>}>

                                                <DataTable<Transaction>
                                                    {...bTxTable}
                                                    columns={[
                                                        {
                                                            key: "transaction_id", label: "TX ID", sortable: true, render: (_: any, row: any) => (
                                                                <p className="font-mono text-xs">{row.transaction_id}</p>
                                                            )
                                                        },
                                                        {
                                                            key: "buyer_id", label: "Buyer ID", sortable: true, render: (_: any, row: any) => (
                                                                <p className="font-mono text-xs">{row.buyer_id}</p>
                                                            )
                                                        },
                                                        {
                                                            key: "product_id", label: "Product ID", sortable: true, render: (_: any, row: any) => (
                                                                <p className="font-mono text-xs">{row.product_id}</p>
                                                            )
                                                        },
                                                        {
                                                            key: "created_at", label: "Date", sortable: true, render: (_: any, row: any) => (
                                                                <p>{formatDate(row.created_at)}</p>
                                                            )
                                                        },
                                                        {
                                                            key: "status", label: "Status", filterable: true, render: (_: any, row: any) => (
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                                                ${row.status === "pending"
                                                                        ? "text-yellow-600"
                                                                        : row.status === "completed" ? "text-green-600" : "text-red-600"
                                                                    }`}>
                                                                    {capitalizeFirstLetter(row.status)}
                                                                </span>
                                                            )
                                                        },
                                                    ]}
                                                />

                                            </Suspense>
                                        )
                                    },
                                    {
                                        label: "Reviews",
                                        content: (
                                            <Suspense fallback={<div className="animate-pulse w-full h-full">Loading...</div>}>

                                                <DataTable<Reviews>
                                                    {...bRvwsTable}
                                                    columns={[
                                                        {
                                                            key: "review_id", label: "Rvw ID", sortable: true, render: (_: any, row: any) => (
                                                                <p className="font-mono text-xs">{row.review_id}</p>
                                                            )
                                                        },
                                                        {
                                                            key: "review_description", label: "Description",
                                                        },
                                                        {
                                                            key: "reviewer_id", label: "Reviewer", sortable: true, render: (_: any, row: any) => (
                                                                <p className="font-mono text-xs">{row.reviewer_id}</p>
                                                            )
                                                        },
                                                        {
                                                            key: "created_at", label: "Date", sortable: true, render: (_: any, row: any) => (
                                                                <p>{formatDate(row.created_at)}</p>
                                                            )
                                                        },
                                                        {
                                                            key: "product_id", label: "Product", sortable: true, render: (_: any, row: any) => (
                                                                <p className="font-mono text-xs">{row.product_id}</p>
                                                            )
                                                        },
                                                        {
                                                            key: "rating", label: "Rating", filterable : true,
                                                        },
                                                    ]}
                                                />

                                            </Suspense>
                                        )
                                    }
                                ]} />
                            )}

                            {/* Seller Content */}
                            {selectedUser.user_role === "seller" && (
                                <div>Seller content here</div>
                            )}

                        </div>
                    </div>
                )}

            </div>

        </div>
    )
}

export default Page
