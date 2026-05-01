"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildStoredDescription } from "@/lib/seller/products";

export type CreateSellerProductInput = {
  title: string;
  price: number;
  category: string;
  description: string;
  isDraft: boolean;
};

export async function createSellerProduct(
  input: CreateSellerProductInput,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const uid = claimsData?.claims?.sub;
  if (!uid) {
    return { error: "Not signed in" };
  }
  const { error } = await supabase.from("products").insert({
    product_name: input.title.trim(),
    product_description: buildStoredDescription({
      isDraft: input.isDraft,
      category: input.category,
      description: input.description,
    }),
    price: input.price,
    seller_owner_id: uid,
  });
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/seller/assets");
  revalidatePath("/seller/view-assets");
  return { error: null };
}

export async function deleteSellerProduct(
  productId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const uid = claimsData?.claims?.sub;
  if (!uid) {
    return { error: "Not signed in" };
  }
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("product_id", productId)
    .eq("seller_owner_id", uid);
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/seller/assets");
  revalidatePath("/seller/view-assets");
  return { error: null };
}
