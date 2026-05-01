import { createClient } from "@/lib/supabase/server";
import type { AssetItem, AssetStatus } from "@/components/seller/seller-assets";

export type ProductRow = {
  product_id: string;
  product_name: string;
  product_description: string | null;
  price: number;
  created_at: string;
  seller_owner_id: string;
};

const DRAFT_PREFIX = "[DRAFT]\n";

/**
 * We encode category and draft in `product_description` because the
 * `products` table has no separate columns. New listings use
 * "Category: …" + body; legacy rows are shown as a single "Product" category.
 */
export function buildStoredDescription(input: {
  isDraft: boolean;
  category: string;
  description: string;
}): string {
  const core = `Category: ${input.category}\n\n${input.description.trim()}`;
  return input.isDraft ? `${DRAFT_PREFIX}${core}` : core;
}

function parseStoredDescription(
  raw: string | null,
): { status: AssetStatus; category: string; body: string } {
  if (raw == null || raw === "") {
    return { status: "Published", category: "Product", body: "" };
  }
  let s = raw;
  let status: AssetStatus = "Published";
  if (s.startsWith(DRAFT_PREFIX)) {
    status = "Draft";
    s = s.slice(DRAFT_PREFIX.length);
  }
  const m = s.match(/^Category:\s*([^\n]+)\n\n([\s\S]*)$/);
  if (m) {
    return { status, category: m[1].trim(), body: m[2] };
  }
  return { status, category: "Product", body: s };
}

export function productRowToAssetItem(row: ProductRow): AssetItem {
  const { status, category, body } = parseStoredDescription(
    row.product_description,
  );
  const d = new Date(row.created_at);
  const date = Number.isNaN(d.getTime())
    ? String(row.created_at).split("T")[0] ?? ""
    : d.toISOString().split("T")[0];
  return {
    id: row.product_id,
    title: row.product_name,
    price: row.price,
    status,
    views: 0,
    downloads: 0,
    date,
    category,
    description: body,
  };
}

export async function listSellerProductRows(): Promise<{
  rows: ProductRow[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const uid = claimsData?.claims?.sub;
  if (!uid) {
    return { rows: [], error: "Not signed in" };
  }
  const { data, error } = await supabase
    .from("products")
    .select(
      "product_id, product_name, product_description, price, created_at, seller_owner_id",
    )
    .eq("seller_owner_id", uid)
    .order("created_at", { ascending: false });
  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data as ProductRow[]) ?? [], error: null };
}

export async function getSellerProductById(
  productId: string,
): Promise<{ product: AssetItem | null; error: string | null }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const uid = claimsData?.claims?.sub;
  if (!uid) {
    return { product: null, error: "Not signed in" };
  }
  const { data, error } = await supabase
    .from("products")
    .select(
      "product_id, product_name, product_description, price, created_at, seller_owner_id",
    )
    .eq("product_id", productId)
    .eq("seller_owner_id", uid)
    .maybeSingle();
  if (error) {
    return { product: null, error: error.message };
  }
  if (!data) {
    return { product: null, error: null };
  }
  return { product: productRowToAssetItem(data as ProductRow), error: null };
}
