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
import { formatDate } from "@/lib/functions";

type AuditLog = {
    id: string
    created_at: string
    action_name: string
    action_description: string
    affected_resource: string
    actor: string
}

const page = () => {

    const table = useDataTable("audit_logs", {
        searchableColumns: [
            "action_description",
        ],
        enabled: true
    })

    // Tabs to cycle between in buyers

    return (
        <div className='flex flex-col p-4 bg-background w-full gap-4'>
            {/* Header */}
            <div className="flex flex-row justify-between">
                <h1 className='font-bold text-3xl'>Audit Logs</h1>
                <div className="flex flex-row gap-2 h-full items-center">

                </div>
            </div>

            <hr />

            {/* Content */}
            <div className='flex gap-4 h-full'>

                {/* Data Table */}
                <Suspense fallback={<div>Loading...</div>}>
                    <DataTable<AuditLog>
                        {...table}
                        columns={[
                            {
                                key: "id", label: "Log ID", sortable: true, render: (_: any, row: any) => (
                                    <p className="font-mono text-[10px] truncate max-w-[100px]">{row.id}</p>
                                )
                            },
                            {
                                key: "created_at", label: "Timestamp", sortable: true, render: (_: any, row: any) => (
                                    <p className="font-mono text-[10px] truncate max-w-[150px]">{row.created_at}</p>
                                )
                            },
                            { key: "action_name", label: "Action Name", filterable: true },
                            { key: "action_description", label: "Description", searchable : true },
                            { key: "affected_resource", label: "Source", filterable : true },
                            {
                                key: "actor", label: "Actor ID", sortable: true, render: (_: any, row: any) => (
                                    <p className="font-mono text-xs">{row.actor}</p>
                                )
                            },
                            // TODO: Make an archive button or something - find out
                            // { key: "id", label: "Actions", sortable: false, render: (_: any, row: any) => <ActionButtons row={row} table={table} setIsTableHidden={setIsTableHidden} /> },
                        ]}
                    />
                </Suspense>

            </div>

        </div>
    )
}

export default page
