import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const supabase = createAdminClient();

export async function GET(
    req: Request,
    { params }: { params: Promise<{ product_id: string }> }
) {
    try {
        const { product_id } = await params

        // Fetch product
        const { data: product, error } = await supabase
            .from("products")
            .select("*")
            .eq("product_id", product_id)
            .single()

        if (error || !product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            )
        }

        // Fetch seller (FIX TABLE NAME)
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", product.seller_owner_id)
            .single()

        if (userError) {
            console.error("User fetch error:", userError)
        }

        // Fetch images
        const { data: files, error: storageError } = await supabase.storage
            .from("asset_photos")
            .list(`${product_id}/photos`, {
                limit: 20
            })

        if (storageError) {
            console.error("Storage error:", storageError)
        }

        const images =
            files
                ?.filter((file) => file.name !== "thumbnail")
                .map((file) => {
                    const { data } = supabase.storage
                        .from("asset_photos")
                        .getPublicUrl(`${product_id}/photos/${file.name}`)

                    return data.publicUrl
                }) || []

        return NextResponse.json({
            product,
            images,
            user
        })

    } catch (err) {
        console.error(err)
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        )
    }
}