import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"



export async function POST(req: Request) {
    const supabase = createAdminClient();
    try {
        const formData = await req.formData()

        const file = formData.get("file") as File
        const blockId = formData.get("blockId") as string
        const folder = formData.get("folder") as string

        if (!file || !blockId) {
            return NextResponse.json({ error: "Missing file or blockId" }, { status: 400 })
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

        return NextResponse.json({ url: data.publicUrl })

    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Upload failed" },
            { status: 500 }
        )
    }
}