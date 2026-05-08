import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"



export async function POST(req: Request) {
    const supabase = createAdminClient();
    try {
        const formData = await req.formData()

        const file = formData.get("file") as File
        const userId = formData.get("userId") as string

        if (!file || !userId) {
            return NextResponse.json({ error: "Missing file or userId" }, { status: 400 })
        }

        const fileExt = file.name.split(".").pop()
        const fileName = `avatar.${fileExt}`
        const filePath = `${userId}/${fileName}`

        const { data: listData, error: listError } = await supabase.storage
            .from("user_profiles")
            .list(userId)

        if (!listError && listData && listData.length > 0) {
            const filesToDelete = listData
                .filter(item => !item.name.startsWith('.') && item.name !== fileName)
                .map(item => `${userId}/${item.name}`)

            if (filesToDelete.length > 0) {
                await supabase.storage
                    .from("user_profiles")
                    .remove(filesToDelete)
            }
        }

        const { error } = await supabase.storage
            .from("user_profiles")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: true
            })

        if (error) throw error

        const { data } = supabase.storage
            .from("user_profiles")
            .getPublicUrl(filePath)

        return NextResponse.json({ url: data.publicUrl })

    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Upload failed" },
            { status: 500 }
        )
    }
}
