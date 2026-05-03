import type { SupabaseClient } from "@supabase/supabase-js";

/** Public bucket used for listing photos (see Supabase dashboard). */
export const ASSET_PHOTOS_BUCKET = "asset_photos";

export function sanitizeStorageFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.length > 0 ? base : "file";
}

/** Cover image: `asset_photos/{productId}/photos/thumbnail/{file}` */
export function thumbnailObjectPath(productId: string, fileName: string): string {
  return `${productId}/photos/thumbnail/${sanitizeStorageFileName(fileName)}`;
}

/** Gallery images/videos: `asset_photos/{productId}/photos/{file}` (not inside `thumbnail`) */
export function detailObjectPath(productId: string, fileName: string): string {
  return `${productId}/photos/${sanitizeStorageFileName(fileName)}`;
}

export function uniqueDetailStorageName(original: string): string {
  const safe = sanitizeStorageFileName(original);
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${stamp}_${safe}`;
}

export async function uploadSellerAssetPhotos(
  supabase: SupabaseClient,
  productId: string,
  input: { cover: File | null; detailFiles: File[] },
): Promise<{ error: string | null }> {
  if (input.cover) {
    const path = thumbnailObjectPath(productId, input.cover.name);
    const { error } = await supabase.storage.from(ASSET_PHOTOS_BUCKET).upload(path, input.cover, {
      upsert: true,
      contentType: input.cover.type || undefined,
    });
    if (error) return { error: error.message };
  }

  for (const file of input.detailFiles) {
    const path = detailObjectPath(productId, uniqueDetailStorageName(file.name));
    const { error } = await supabase.storage.from(ASSET_PHOTOS_BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) return { error: error.message };
  }

  return { error: null };
}
