import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ASSET_PHOTOS_BUCKET } from "@/lib/seller/asset-storage";
import { createAdminClient } from "@/lib/supabase/admin";

const phpFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
});

function formatPeso(amount: number) {
    return amount <= 0 ? "Free" : phpFormatter.format(amount);
}

async function getRatingStats(productIds: string[]) {
    if (productIds.length === 0) {
        return new Map<string, { average: number; count: number }>();
    }

    const admin = createAdminClient();
    const { data } = await admin
        .from("reviews")
        .select("product_id, rating")
        .in("product_id", productIds);

    const totals = new Map<string, { sum: number; count: number }>();

    for (const review of data ?? []) {
        const productId = String(review.product_id ?? "");
        const rating = Number(review.rating ?? 0);

        if (!productId || !Number.isFinite(rating)) continue;

        const current = totals.get(productId) ?? { sum: 0, count: 0 };
        current.sum += rating;
        current.count += 1;
        totals.set(productId, current);
    }

    return new Map(
        Array.from(totals.entries()).map(([productId, value]) => [
            productId,
            {
                average: value.count > 0 ? value.sum / value.count : 0,
                count: value.count,
            },
        ]),
    );
}

async function getThumbnailMap(productIds: string[]) {
    const admin = createAdminClient();
    const entries = await Promise.all(
        productIds.map(async (productId) => {
            const { data: thumbs } = await admin.storage
                .from(ASSET_PHOTOS_BUCKET)
                .list(`${productId}/photos/thumbnail`, {
                    limit: 20,
                    sortBy: { column: "name", order: "asc" },
                });

            const name = thumbs?.[0]?.name;
            if (!name) return [productId, "/pithos/PithosThumbnail.png"] as const;

            const { data } = admin.storage
                .from(ASSET_PHOTOS_BUCKET)
                .getPublicUrl(`${productId}/photos/thumbnail/${name}`);

            return [productId, data.publicUrl || "/pithos/PithosThumbnail.png"] as const;
        }),
    );

    return new Map(entries);
}

// GET /api/cart/suggestions?limit=5&exclude=id1,id2,id3
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    const limit = Math.max(1, Number(searchParams.get("limit") ?? "4"));
    const excludeIds = searchParams.get("exclude")
        ? searchParams.get("exclude")!.split(",").filter(Boolean)
        : [];

    const admin = createAdminClient();
    const { data: products } = await admin
        .from("products")
        .select("product_id, product_name, product_description, price, seller_owner_id")
        .eq("product_status", "published")
        .limit(Math.max(limit + excludeIds.length, limit + 2));

    const filtered = (products ?? [])
        .filter((product) => !excludeIds.includes(String(product.product_id ?? "")))
        .slice(0, limit);

    const productIds = filtered.map((product) => String(product.product_id ?? ""));
    const [ratingById, thumbnails] = await Promise.all([
        getRatingStats(productIds),
        getThumbnailMap(productIds),
    ]);

    const sellerIds = [
        ...new Set(
            filtered.map((product) => String(product.seller_owner_id ?? "")).filter(Boolean),
        ),
    ];

    const { data: sellers } =
        sellerIds.length > 0
            ? await admin.from("users").select("id, user_fullname").in("id", sellerIds)
            : { data: [] };

    const sellerById = new Map(
        (sellers ?? []).map((seller) => [
            String(seller.id),
            String(seller.user_fullname ?? "Unknown seller"),
        ]),
    );

    const suggestions = filtered.map((product) => {
        const productId = String(product.product_id ?? "");
        const rating = ratingById.get(productId);
        const price = Number(product.price ?? 0);

        return {
            id: productId,
            title: String(product.product_name ?? "Untitled Asset"),
            subtitle: String(product.product_name ?? "Untitled Asset"),
            rating: Number((rating?.average ?? 0).toFixed(1)),
            reviews: rating?.count ?? 0,
            author:
                sellerById.get(String(product.seller_owner_id ?? "")) ?? "Unknown seller",
            price: formatPeso(price),
            imageSrc: thumbnails.get(productId) ?? "/pithos/PithosThumbnail.png",
            link: `/product-detail/${productId}`,
        };
    });

    return NextResponse.json(suggestions, { status: 200 });
}