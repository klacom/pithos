"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ─── Shared types ────────────────────────────────────────────────────────────

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

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

function refreshShopViews(productId?: string) {
  revalidatePath("/shopping-cart");
  if (productId) {
    revalidatePath(`/product-detail/${productId}`);
  }
}

// ─── Fetch helpers (thin wrappers around the GET API routes) ──────────────────
// These are plain async functions — NOT server actions — and can be called from
// client components or other server code.  They delegate all data fetching to
// the corresponding route handlers under /api/cart/.

export type SuggestedProduct = {
  id: string;
  title: string;
  subtitle: string;
  rating: number;
  reviews: number;
  author: string;
  price: string;
  imageSrc: string;
  link: string;
};

// export async function getProductViewerState(productId: string) {
//   const res = await fetch(
//     `/api/cart/viewer-state?productId=${encodeURIComponent(productId)}`,
//     { cache: "no-store" },
//   );

//   if (!res.ok) {
//     return {
//       isInCart: false,
//       isFavorite: false,
//       isOwner: false,
//       isLoggedIn: false,
//     };
//   }

//   return res.json() as Promise<{
//     isInCart: boolean;
//     isFavorite: boolean;
//     isOwner: boolean;
//     isLoggedIn: boolean;
//   }>;
// }

// ─── Mutation server actions ──────────────────────────────────────────────────

async function getCartCount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { count } = await supabase
    .from("cart")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return count ?? 0;
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
      { user_id: user.id, product_id: productId },
      { onConflict: "user_id,product_id" },
    );

  if (error) {
    return { success: false, error: error.message };
  }

  refreshShopViews(productId);

  const count = await getCartCount();

  return { success: true, cartCount: count };
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
    return { success: true, action: "removed" as const };
  }

  const { error } = await supabase.from("favorites").insert({
    user_id: user.id,
    product_id: productId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  refreshShopViews(productId);
  return { success: true, action: "added" as const };
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

  const count = await getCartCount();

  return { success: true, cartCount: count };
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
  const favoriteResult = await toggleFavorite(productId);

  if (!favoriteResult.success) {
    return favoriteResult;
  }

  const removeResult = await removeCartItem(productId);

  if (!removeResult.success) {
    return removeResult;
  }

  return {
    success: true,
    action: favoriteResult.action,
    cartCount: removeResult.cartCount,
  };
}