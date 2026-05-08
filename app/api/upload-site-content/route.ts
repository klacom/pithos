import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createAudit } from "@/lib/supabase/create-audit"
import { createClient } from "@/lib/supabase/server"
import { validateSiteContentImage } from "@/lib/upload-validation"



export async function POST(req: Request) {
    const supabase = createAdminClient();
    const supabaseServer = await createClient();
    try {
        const formData = await req.formData()

        const file = formData.get("file") as File
        const blockId = formData.get("blockId") as string
        const folder = formData.get("folder") as string

        if (!file || !blockId) {
            return NextResponse.json({ error: "Missing file or blockId" }, { status: 400 })
        }

        // Validate site content image
        const validationError = validateSiteContentImage(file);
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 })
        }

        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}.${fileExt}`

        const filePath = `${folder}/${blockId}/${fileName}`

        const { error } = await supabase.storage
            .from("site_content_photos")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false
            })

        if (error) throw error

        const { data } = supabase.storage
            .from("site_content_photos")
            .getPublicUrl(filePath)

        // Audit log for site content upload
        try {
            const { data: claimsData } = await supabaseServer.auth.getClaims();
            const uid = claimsData?.claims?.sub;

            if (uid) {
                await createAudit({
                    action_name: "SITE_CONTENT_UPLOADED",
                    action_description: `Admin uploaded site content image: ${file.name} (${(file.size / 1024).toFixed(2)}KB) to folder ${folder}`,
                    affected_resources: `site_content:${blockId}`,
                    actor: uid,
                });
            }
        } catch (auditError) {
            console.error("Audit log failed for site content upload:", auditError);
        }

        return NextResponse.json({ url: data.publicUrl })

    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Upload failed" },
            { status: 500 }
        )
    }
}