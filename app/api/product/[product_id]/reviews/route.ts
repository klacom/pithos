import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const supabase = createAdminClient();

export async function GET(
    req: Request,
    { params }: { params: Promise<{ product_id: string }> }
) {
    try {
        const { product_id } = await params

        // Fetch reviews for the product
        const { data: reviews, error } = await supabase
            .from("reviews")
            .select("*")
            .eq("product_id", product_id)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Reviews fetch error:", error)
            return NextResponse.json(
                { reviews: [], avgRating: 0, reviewCount: 0 },
                { status: 200 }
            )
        }

        // Calculate average rating
        let avgRating = 0;
        if (reviews && reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0)
            avgRating = totalRating / reviews.length
        }

        return NextResponse.json({
            reviews: reviews || [],
            avgRating: parseFloat(avgRating.toFixed(1)),
            reviewCount: reviews?.length || 0
        })

    } catch (err) {
        console.error(err)
        return NextResponse.json(
            { error: "Server error", reviews: [], avgRating: 0, reviewCount: 0 },
            { status: 500 }
        )
    }
}
