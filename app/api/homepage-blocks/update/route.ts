import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
    const supabase = createAdminClient();
    try {
        const body = await req.json()

        const { id, content } = body

        if (!id || !content) {
            return NextResponse.json(
                { error: "Missing id or content" },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from("homepage_blocks")
            .update({
                content,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ data })
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Update failed" },
            { status: 500 }
        )
    }
}