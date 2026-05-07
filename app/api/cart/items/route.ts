import { NextResponse } from "next/server";
import { ASSET_PHOTOS_BUCKET } from "@/lib/seller/asset-storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CartListItem } from "@/app/shop-actions";

const phpFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
});

function formatPeso(amount: number) {
    return amount <= 0 ? "Free" : phpFormatter.format(amount);
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

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json([], { status: 200 });
    }

    const { data: cartRows, error: cartError } = await supabase
        .from("cart")
        .select("product_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (cartError || !cartRows?.length) {
        return NextResponse.json([], { status: 200 });
    }

    const productIds = [
        ...new Set(cartRows.map((row) => String(row.product_id ?? "")).filter(Boolean)),
    ];

    const admin = createAdminClient();
    const [productsResult, thumbnails] = await Promise.all([
        admin
            .from("products")
            .select(
                "product_id, product_name, product_description, price, seller_owner_id, product_status",
            )
            .in("product_id", productIds),
        getThumbnailMap(productIds),
    ]);

    let products = productsResult.data ?? [];

    if (products.length < productIds.length) {
        const fallbackProducts = await Promise.all(
            productIds.map(async (productId) => {
                const { data } = await admin
                    .from("products")
                    .select(
                        "product_id, product_name, product_description, price, seller_owner_id, product_status",
                    )
                    .eq("product_id", productId)
                    .maybeSingle();

                return data;
            }),
        );

        const mergedById = new Map<string, (typeof products)[number]>();
        for (const product of products) {
            if (product?.product_id != null) {
                mergedById.set(String(product.product_id), product);
            }
        }
        for (const product of fallbackProducts) {
            if (product?.product_id != null) {
                mergedById.set(String(product.product_id), product);
            }
        }
        products = Array.from(mergedById.values());
    }

    const sellerIds = [
        ...new Set(
            products
                .map((product) => String(product.seller_owner_id ?? ""))
                .filter(Boolean),
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

    const productById = new Map(
        products.map((product) => [String(product.product_id), product]),
    );

    const items: CartListItem[] = cartRows
        .map((row) => {
            const productId = String(row.product_id ?? "");
            const product = productById.get(productId);
            if (!product) return null;

            const price = Number(product.price ?? 0);

            return {
                productId,
                title: String(product.product_name ?? "Untitled asset"),
                subtitle: String(product.product_description ?? "").trim(),
                sellerName:
                    sellerById.get(String(product.seller_owner_id ?? "")) ?? "Unknown seller",
                price,
                priceLabel: formatPeso(price),
                imageSrc: thumbnails.get(productId) ?? "/pithos/PithosThumbnail.png",
                addedAt: String(row.created_at ?? new Date().toISOString()),
                productStatus: String(product.product_status ?? "published"),
            } satisfies CartListItem;
        })
        .filter((item): item is CartListItem => Boolean(item));

    return NextResponse.json(items, { status: 200 });
}