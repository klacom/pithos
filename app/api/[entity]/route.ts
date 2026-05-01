// app/api/[entity]/route.ts

import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ entity: string }> }
) {
    const { entity } = await context.params
    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)

    const page = Number(searchParams.get("page") ?? 1)
    const q = searchParams.get("q") ?? ""
    const sort = searchParams.get("sort") ?? ""
    const order = searchParams.get("order") ?? "asc"
    const filters: Record<string, string[]> = {};
    const baseFilters: Record<string, string> = {};

    const limit = 9
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
        .from(entity)
        .select("*", { count: "exact" })

    // Parse Filters
    searchParams.forEach((value, key) => {
        const match = key.match(/^filter\[(.+)\]$/);
        if (match) {
            const column = match[1];
            if (!filters[column]) filters[column] = [];
            filters[column].push(value);
        }
    });

    // Parse Base Filters
    searchParams.forEach((value, key) => {
        const match = key.match(/^base\[(.+)\]$/);
        if (match) {
            const column = match[1];
            baseFilters[column] = value;
        }
    });

    console.log("Base Filters:", baseFilters);

    // Apply Base Filters
    if (Object.keys(baseFilters).length > 0) {
        Object.entries(baseFilters).forEach(([column, value]) => {
            query = query.eq(column, value);
        });
    }

    // Search across fields
    const searchColumns = searchParams.getAll("search");

    if (q && searchColumns.length > 0) {
        const orQuery = searchColumns
            .map(col => `${col}.ilike.%${q}%`)
            .join(",");

        query = query.or(orQuery);
    }

    // Apply Filters
    if (filters) {
        Object.entries(filters).forEach(([column, values]) => {
            if (values.length === 1) {
                query = query.eq(column, values[0]);
            } else {
                query = query.in(column, values);
            }
        });
    }

    // Sort/Order
    if (sort) query = query.order(sort, { ascending: order === "asc" })

    // Do the query, destructure the following return values.
    const { data, count, error } = await query.range(from, to)

    // Log Supabase errors
    if (error) {
        console.error("Supabase query error:", {
            entity: entity,
            error,
            query: { page, q, sort, order, from, to }
        })
    }

    // Return
    return NextResponse.json(
        {
            data,
            total: count,
            error: error ? error.message : null, 
        },
        {
            status: error ? 500 : 200,
        }
    )
}