import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
    const supabase = createAdminClient();
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