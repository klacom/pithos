import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AssetItem, AssetStatus } from "@/components/seller/seller-assets";
import { ASSET_PHOTOS_BUCKET } from "@/lib/seller/asset-storage";

export type ProductRow = {
  product_id: string;
  product_name: string;
  product_description: string | null;
  product_status?: string | null;
  price: number;
  created_at: string;
  seller_owner_id: string;
  cover_image_url?: string | null;
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
  tags?: string[];
  description: string;
}): string {
  const cleanTags = (input.tags ?? [])
    .map((t) => t.trim())
    .filter(Boolean);
  const tagsLine = cleanTags.length > 0 ? `Tags: ${cleanTags.join(", ")}\n` : "";
  return `Category: ${input.category}\n${tagsLine}\n${input.description.trim()}`;
}

function parseStoredDescription(
  raw: string | null,
): { status: AssetStatus; category: string; tags: string[]; body: string } {
  if (raw == null || raw === "") {
    return { status: "Published", category: "Product", tags: [], body: "" };
  }
  let s = raw;
  let status: AssetStatus = "Published";
  if (s.startsWith(DRAFT_PREFIX)) {
    status = "Draft";
    s = s.slice(DRAFT_PREFIX.length);
  }
  const m = s.match(/^Category:\s*([^\n]+)\n(?:Tags:\s*([^\n]+)\n)?\n([\s\S]*)$/);
  if (m) {
    const tags =
      m[2]?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
    return { status, category: m[1].trim(), tags, body: m[3] };
  }
  return { status, category: "Product", tags: [], body: s };
}

function normalizeProductStatus(value: string | null | undefined): AssetStatus | null {
  const v = value?.trim().toLowerCase();
  if (v === "draft") return "Draft";
  if (v === "published") return "Published";
  if (v === "archived") return "Archived";
  return null;
}

export function productRowToAssetItem(row: ProductRow): AssetItem {
  const parsed = parseStoredDescription(
    row.product_description,
  );
  const status = normalizeProductStatus(row.product_status) ?? parsed.status;
  const d = new Date(row.created_at);
  const date = Number.isNaN(d.getTime())
    ? String(row.created_at).split("T")[0] ?? ""
    : d.toISOString().split("T")[0];
  return {
    id: row.product_id,
    title: row.product_name,
    price: row.price,
    status,
    coverImageUrl: row.cover_image_url ?? null,
    views: 0,
    downloads: 0,
    date,
    category: parsed.category,
    tags: parsed.tags,
    description: parsed.body,
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
      "product_id, product_name, product_description, product_status, price, created_at, seller_owner_id",
    )
    .eq("seller_owner_id", uid)
    .order("created_at", { ascending: false });
  if (error) {
    return { rows: [], error: error.message };
  }
  const rows = (data as ProductRow[]) ?? [];
  if (rows.length === 0) {
    return { rows, error: null };
  }

  try {
    const admin = createAdminClient();
    const coverByProductId = new Map<string, string>();

    await Promise.all(
      rows.map(async (row) => {
        const { data: thumbnails, error: thumbErr } = await admin.storage
          .from(ASSET_PHOTOS_BUCKET)
          .list(`${row.product_id}/photos/thumbnail`, {
            limit: 20,
            sortBy: { column: "name", order: "asc" },
          });
        if (thumbErr || !thumbnails || thumbnails.length === 0) return;
        const fileName = thumbnails[0]?.name;
        if (!fileName) return;
        const { data: pub } = admin.storage
          .from(ASSET_PHOTOS_BUCKET)
          .getPublicUrl(`${row.product_id}/photos/thumbnail/${fileName}`);
        if (pub?.publicUrl) {
          coverByProductId.set(row.product_id, pub.publicUrl);
        }
      }),
    );

    const enriched = rows.map((row) => ({
      ...row,
      cover_image_url: coverByProductId.get(row.product_id) ?? null,
    }));
    return { rows: enriched, error: null };
  } catch {
    return { rows, error: null };
  }
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
      "product_id, product_name, product_description, product_status, price, created_at, seller_owner_id",
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
