import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createAudit } from "@/lib/supabase/create-audit"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
    const supabaseAdmin = createAdminClient();
    const supabase = await createClient();
    try {
        const body = await req.json()

        const { id, content } = body

        if (!id || !content) {
            return NextResponse.json(
                { error: "Missing id or content" },
                { status: 400 }
            )
        }

        const { data: claimsData } = await supabase.auth.getClaims();
        const uid = claimsData?.claims?.sub;

        const { data, error } = await supabaseAdmin
            .from("homepage_blocks")
            .update({
                content,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        if (uid) {
            await createAudit({
                action_name: "SITE_CONTENT_UPDATED",
                action_description: `Admin updated homepage block: ${id} (${content.title || 'No Title'})`,
                affected_resources: `homepage_blocks:${id}`,
                actor: uid,
            });
        }

        return NextResponse.json({ data })
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Update failed" },
            { status: 500 }
        )
    }
}