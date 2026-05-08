import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeStorageFileName } from "@/lib/seller/asset-storage";

/** Private bucket for downloadable archives (see Supabase dashboard). */
export const ASSETS_STORAGE_BUCKET = "assets_storage";

function uniquePackageStorageName(original: string): string {
  const safe = sanitizeStorageFileName(original);
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${stamp}_${safe}`;
}

/** Path: `assets_storage/{productId}/{unique}_{filename}` */
export async function uploadSellerPackageFile(
  supabase: SupabaseClient,
  productId: string,
  file: File,
): Promise<{ error: string | null }> {
  const path = `${productId}/${uniquePackageStorageName(file.name)}`;
  const { error } = await supabase.storage.from(ASSETS_STORAGE_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  return { error: error?.message ?? null };
}
