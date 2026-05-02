import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { column_name, table_name, baseFilters } = await req.json();

        const supabase = createAdminClient();

        let column = column_name;
        let table = table_name;

        // Handle nested fields
        if (column_name.includes(".")) {
            const parts = column_name.split(".");
            table = parts[0];  
            column = parts[1]; 
        }

        // Call RPC
        const { data, error } = await supabase.rpc("get_distinct_values", {
            col: column,
            tbl: table,
            filters: baseFilters || null
        });

        if (error) {
            console.error("Distinct RPC error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });

    } catch (err: any) {
        console.error("fetch-distinct-values error:", err);
        return NextResponse.json(
            { error: err.message || "Unexpected error" },
            { status: 500 }
        );
    }
}