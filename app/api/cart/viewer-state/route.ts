import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/cart/viewer-state?productId=abc123
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const productId = searchParams.get("productId");

    if (!productId) {
        return NextResponse.json(
            { error: "Missing required query parameter: productId" },
            { status: 400 },
        );
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            {
                isInCart: false,
                isFavorite: false,
                isOwner: false,
                isLoggedIn: false,
            },
            { status: 200 },
        );
    }

    const [{ data: cartRow }, { data: favoriteRow }, { data: purchaseRow }] =
        await Promise.all([
            supabase
                .from("cart")
                .select("product_id")
                .eq("user_id", user.id)
                .eq("product_id", productId)
                .maybeSingle(),
            supabase
                .from("favorites")
                .select("product_id")
                .eq("user_id", user.id)
                .eq("product_id", productId)
                .maybeSingle(),
            supabase
                .from("transactions")
                .select("product_id")
                .eq("buyer_id", user.id)
                .eq("product_id", productId)
                .eq("status", "completed")
                .maybeSingle(),
        ]);

    return NextResponse.json(
        {
            isInCart: Boolean(cartRow),
            isFavorite: Boolean(favoriteRow),
            isOwner: Boolean(purchaseRow),
            isLoggedIn: true,
        },
        { status: 200 },
    );
}