import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const supabase = createAdminClient();

export async function GET() {
    const { data, error } = await supabase
        .from("homepage_blocks")
        .select("*")
        .order("order_index", { ascending: true })

    // console.log("HomePage Block Server :", data);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}