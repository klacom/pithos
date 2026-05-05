import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ASSET_PHOTOS_BUCKET } from "@/lib/seller/asset-storage"

const supabase = createAdminClient();

async function getRatingStats(productIds: string[]): Promise<
    Map<string, { avg: number; count: number }>
> {
    if (productIds.length === 0) return new Map();
    const { data, error } = await supabase
        .from("reviews")
        .select("product_id, rating")
        .in("product_id", productIds);
    if (error || !data) {
        console.error("reviews fetch:", error?.message);
        return new Map();
    }
    const agg = new Map<string, { sum: number; count: number }>();
    for (const r of data as Array<{ product_id: string | null; rating: any }>) {
        const pid = String(r.product_id ?? "");
        if (!pid) continue;
        const num = Number(r.rating);
        if (!Number.isFinite(num)) continue;
        const prev = agg.get(pid) ?? { sum: 0, count: 0 };
        prev.sum += num;
        prev.count += 1;
        agg.set(pid, prev);
    }
    const out = new Map<string, { avg: number; count: number }>();
    for (const [pid, v] of agg) {
        out.set(pid, { avg: v.count > 0 ? v.sum / v.count : 0, count: v.count });
    }
    return out;
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const exclude = url.searchParams.get("exclude") || "";
        const limit = parseInt(url.searchParams.get("limit") || "4", 10);

        // Fetch random published products
        const { data: products, error } = await supabase
            .from("products")
            .select("product_id, product_name, product_description, price, seller_owner_id, created_at")
            .eq("product_status", "published")
            .limit(limit + 1); // +1 to account for excluded product

        if (error) {
            console.error("Products fetch error:", error)
            return NextResponse.json({ products: [] }, { status: 200 })
        }

        if (!products) {
            return NextResponse.json({ products: [] }, { status: 200 })
        }

        // Filter out the excluded product and randomize
        let filteredProducts = products.filter(p => String(p.product_id) !== exclude);
        // Shuffle array
        filteredProducts = filteredProducts.sort(() => Math.random() - 0.5).slice(0, limit);

        // Get ratings
        const productIds = filteredProducts.map(p => String(p.product_id));
        const ratingById = await getRatingStats(productIds);

        // Get seller names
        const sellerIds = [
            ...new Set(
                filteredProducts
                    .map((p) => String(p.seller_owner_id ?? ""))
                    .filter((v) => v !== ""),
            ),
        ];
        const sellerNameById = new Map<string, string>();
        if (sellerIds.length > 0) {
            const { data: users } = await supabase
                .from("users")
                .select("id, user_fullname")
                .in("id", sellerIds);
            for (const u of users ?? []) {
                sellerNameById.set(String(u.id), String(u.user_fullname ?? "Unknown seller"));
            }
        }

        // Get thumbnails
        const thumbByProductId = new Map<string, string>();
        await Promise.all(
            filteredProducts.map(async (product) => {
                const pid = String(product.product_id);
                const { data: thumbs } = await supabase.storage
                    .from(ASSET_PHOTOS_BUCKET)
                    .list(`${pid}/photos/thumbnail`, {
                        limit: 20,
                        sortBy: { column: "name", order: "asc" },
                    });
                const name = thumbs?.[0]?.name;
                if (!name) return;
                const { data: pub } = supabase.storage
                    .from(ASSET_PHOTOS_BUCKET)
                    .getPublicUrl(`${pid}/photos/thumbnail/${name}`);
                if (pub.publicUrl) thumbByProductId.set(pid, pub.publicUrl);
            }),
        );

        // Map products to response format
        const mapped = filteredProducts.map((product) => {
            const price = Number(product.price ?? 0);
            const pid = String(product.product_id);
            const rs = ratingById.get(pid);
            const avgRating = rs?.avg ?? 0;
            const reviewCount = rs?.count ?? 0;

            return {
                id: pid,
                title: String(product.product_name ?? "Untitled Asset"),
                subtitle: String(product.product_name ?? "Untitled Asset"),
                rating: avgRating,
                reviews: reviewCount,
                author: sellerNameById.get(String(product.seller_owner_id ?? "")) ?? "Unknown seller",
                price:
                    price <= 0
                        ? "Free"
                        : new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                        }).format(price),
                imageSrc: thumbByProductId.get(pid) ?? "/pithos/PithosThumbnail.png",
                link: `/product-detail/${pid}`,
            };
        });

        return NextResponse.json({
            products: mapped
        })

    } catch (err) {
        console.error(err)
        return NextResponse.json(
            { error: "Server error", products: [] },
            { status: 500 }
        )
    }
}
