"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { ASSET_PHOTOS_BUCKET } from "@/lib/seller/asset-storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export type CartListItem = {
  productId: string;
  title: string;
  subtitle: string;
  sellerName: string;
  price: number;
  priceLabel: string;
  imageSrc: string;
  addedAt: string;
  productStatus: string;
  isFavorite: boolean;
};

type ActionErrorResult = {
  success: false;
  error: string;
};

type CartMutationResult = ActionErrorResult | { success: true; cartCount: number };
type FavoriteToggleResult =
  | ActionErrorResult
  | { success: true; action: "added" | "removed" };
type MoveToFavoritesResult =
  | ActionErrorResult
  | { success: true; action: "added" | "removed"; cartCount: number };

function formatPeso(amount: number) {
  return amount <= 0 ? "Free" : phpFormatter.format(amount);
}

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

const getRatingStats = cache(async (productIds: string[]) => {
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
});

const getThumbnailMap = cache(async (productIds: string[]) => {
  if (productIds.length === 0) return new Map<string, string>();
  const admin = createAdminClient();
  const entries = await Promise.all(
    productIds.map(async (productId) => {
      const { data: thumbs } = await admin.storage
        .from(ASSET_PHOTOS_BUCKET)
        .list(`${productId}/photos/thumbnail`, {
          limit: 1,
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
});

function refreshShopViews(productId?: string) {
  revalidatePath("/shopping-cart");
  if (productId) {
    revalidatePath(`/product-detail/${productId}`);
  }
}

export const getCartCount = cache(async () => {
  const { supabase, user } = await getCurrentUser();

  if (!user) return 0;

  const { count } = await supabase
    .from("cart")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return count ?? 0;
});

export async function getProductViewerState(productId: string) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return {
      isInCart: false,
      isFavorite: false,
      cartCount: 0,
      isLoggedIn: false,
    };
  }

  const [{ data: cartRow }, { data: favoriteRow }, count] = await Promise.all([
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
    getCartCount(),
  ]);

  return {
    isInCart: Boolean(cartRow),
    isFavorite: Boolean(favoriteRow),
    cartCount: count,
    isLoggedIn: true,
  };
}

export async function addToCart(productId: string): Promise<CartMutationResult> {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to add items to your cart.",
    };
  }

  const { error } = await supabase
    .from("cart")
    .upsert(
      {
        user_id: user.id,
        product_id: productId,
      },
      { onConflict: "user_id,product_id" },
    );

  if (error) {
    return { success: false, error: error.message };
  }

  refreshShopViews(productId);

  return {
    success: true,
    cartCount: await getCartCount(),
  };
}

export async function toggleFavorite(productId: string): Promise<FavoriteToggleResult> {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to manage favorites.",
    };
  }

  const { data: existing, error: existingError } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existingError) {
    return { success: false, error: existingError.message };
  }

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);

    if (error) {
      return { success: false, error: error.message };
    }

    refreshShopViews(productId);

    return {
      success: true,
      action: "removed" as const,
    };
  }

  // Use upsert to be more robust against RLS quirks.
  const { error } = await supabase.from("favorites").upsert(
    {
      user_id: user.id,
      product_id: productId,
    },
    { onConflict: "user_id,product_id" },
  );

  if (error) {
    return { success: false, error: error.message };
  }

  refreshShopViews(productId);

  return {
    success: true,
    action: "added" as const,
  };
}

export async function getCartItems(filterIds?: string[]): Promise<CartListItem[]> {
  const { supabase, user } = await getCurrentUser();

  if (!user) return [];

  const query = supabase
    .from("cart")
    .select("product_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (filterIds && filterIds.length > 0) {
    query.in("product_id", filterIds);
  }

  const { data: cartRows, error: cartError } = await query;

  if (cartError || !cartRows?.length) {
    return [];
  }

  const productIds = [
    ...new Set(cartRows.map((row) => String(row.product_id ?? "")).filter(Boolean)),
  ];

  const admin = createAdminClient();
  const [productsResult, thumbnails, favoritesResult] = await Promise.all([
    admin
      .from("products")
      .select(
        "product_id, product_name, product_description, price, seller_owner_id, product_status",
      )
      .in("product_id", productIds),
    getThumbnailMap(productIds),
    supabase
      .from("favorites")
      .select("product_id")
      .eq("user_id", user.id)
      .in("product_id", productIds),
  ]);

  let products = productsResult.data ?? [];
  const favoriteIds = new Set(
    (favoritesResult.data ?? []).map((f) => String(f.product_id)),
  );

  // Fallback to per-product lookup so cart items still render even if the bulk query
  // returns an incomplete result due to type/serialization quirks.
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
      ? await admin
          .from("users")
          .select("id, user_fullname, user_email")
          .in("id", sellerIds)
      : { data: [] };

  const sellerById = new Map(
    (sellers ?? []).map((seller) => [
      String(seller.id),
      String(
        seller.user_fullname ||
          seller.user_email?.split("@")[0] ||
          "Pithos Publisher",
      ),
    ]),
  );

  const productById = new Map(
    products.map((product) => [String(product.product_id), product]),
  );

  return cartRows
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
          sellerById.get(String(product.seller_owner_id ?? "")) ?? "Pithos Publisher",
        price,
        priceLabel: formatPeso(price),
        imageSrc: thumbnails.get(productId) ?? "/pithos/PithosThumbnail.png",
        addedAt: String(row.created_at ?? new Date().toISOString()),
        productStatus: String(product.product_status ?? "published"),
        isFavorite: favoriteIds.has(productId),
      } satisfies CartListItem;
    })
    .filter((item): item is CartListItem => Boolean(item));
}

export async function getSuggestedProducts(limit = 4, excludeIds: string[] = []) {
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
      ? await admin
          .from("users")
          .select("id, user_fullname, user_email")
          .in("id", sellerIds)
      : { data: [] };

  const sellerById = new Map(
    (sellers ?? []).map((seller) => [
      String(seller.id),
      String(
        seller.user_fullname ||
          seller.user_email?.split("@")[0] ||
          "Pithos Publisher",
      ),
    ]),
  );

  return filtered.map((product) => {
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
        sellerById.get(String(product.seller_owner_id ?? "")) ?? "Pithos Publisher",
      price: formatPeso(price),
      imageSrc: thumbnails.get(productId) ?? "/pithos/PithosThumbnail.png",
      link: `/product-detail/${productId}`,
    };
  });
}

export async function removeCartItem(productId: string): Promise<CartMutationResult> {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false, error: "You must be logged in to edit your cart." };
  }

  const { error } = await supabase
    .from("cart")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) {
    return { success: false, error: error.message };
  }

  refreshShopViews(productId);

  return {
    success: true,
    cartCount: await getCartCount(),
  };
}

export async function clearCart(): Promise<CartMutationResult> {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { success: false, error: "You must be logged in to edit your cart." };
  }

  const { error } = await supabase.from("cart").delete().eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  refreshShopViews();

  return { success: true, cartCount: 0 };
}

export async function moveCartItemToFavorites(
  productId: string,
): Promise<MoveToFavoritesResult> {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to manage favorites.",
    };
  }

  // 1. Ensure it's in favorites (don't use toggle, use upsert/insert)
  const { error: favError } = await supabase.from("favorites").upsert(
    {
      user_id: user.id,
      product_id: productId,
    },
    { onConflict: "user_id,product_id" },
  );

  if (favError) {
    return { success: false, error: favError.message };
  }

  // 2. Remove from cart
  const removeResult = await removeCartItem(productId);

  if (!removeResult.success) {
    return removeResult;
  }

  return {
    success: true,
    action: "added",
    cartCount: removeResult.cartCount,
  };
}
