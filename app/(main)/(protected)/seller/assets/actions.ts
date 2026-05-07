"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildStoredDescription } from "@/lib/seller/products";
import {
  ASSET_PHOTOS_BUCKET,
  uploadSellerAssetPhotos,
} from "@/lib/seller/asset-storage";
import {
  ASSETS_STORAGE_BUCKET,
  uploadSellerPackageFile,
} from "@/lib/seller/asset-package-storage";
import {
  isAllowedPackageFile,
  MAX_PACKAGE_FILE_BYTES,
} from "@/lib/seller/package-upload-rules";

export type CreateSellerProductInput = {
  title: string;
  price: number;
  category: string;
  tags?: string[];
  description: string;
  isDraft: boolean;
};

export type SellerProductMediaSummary = {
  hasCover: boolean;
  detailCount: number;
  hasPackage: boolean;
  packageFileNames: string[];
  coverUrl: string | null;
  detailUrls: string[];
};

export async function createSellerProduct(
  input: CreateSellerProductInput,
): Promise<{ error: string | null; productId: string | null }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const uid = claimsData?.claims?.sub;
  if (!uid) {
    return { error: "Not signed in", productId: null };
  }

  // If publishing with price, check for payout methods
  if (!input.isDraft && input.price > 0) {
    const { count } = await supabase
      .from('seller_payout_methods')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', uid);

    if (!count || count === 0) {
      return {
        error: "You must add a payout method in Payout Settings before publishing an asset with a price.",
        productId: null
      };
    }
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      product_name: input.title.trim(),
      product_description: buildStoredDescription({
        isDraft: input.isDraft,
        category: input.category,
        tags: input.tags ?? [],
        description: input.description,
      }),
      product_status: input.isDraft ? "draft" : "published",
      price: input.price,
      seller_owner_id: uid,
    })
    .select("product_id")
    .single();
  if (error) {
    return { error: error.message, productId: null };
  }
  const productId = data?.product_id != null ? String(data.product_id) : null;
  revalidatePath("/seller/assets");
  revalidatePath("/seller/view-assets");
  return { error: null, productId };
}

export type UpdateSellerProductInput = CreateSellerProductInput & {
  productId: string;
};

export async function updateSellerProduct(
  input: UpdateSellerProductInput,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const uid = claimsData?.claims?.sub;
  if (!uid) {
    return { error: "Not signed in" };
  }
  const { data: owned, error: ownErr } = await supabase
    .from("products")
    .select("product_id")
    .eq("product_id", input.productId)
    .eq("seller_owner_id", uid)
    .maybeSingle();
  if (ownErr) {
    return { error: ownErr.message };
  }
  if (!owned) {
    return { error: "Asset not found for this seller account." };
  }

  // If publishing with price, check for payout methods
  if (!input.isDraft && input.price > 0) {
    const { count } = await supabase
      .from('seller_payout_methods')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', uid);

    if (!count || count === 0) {
      return {
        error: "You must add a payout method in Payout Settings before publishing an asset with a price."
      };
    }
  }

  const admin = createAdminClient();
  const targetStatus = input.isDraft ? "draft" : "published";
  const { error } = await admin
    .from("products")
    .update({
      product_name: input.title.trim(),
      product_description: buildStoredDescription({
        isDraft: input.isDraft,
        category: input.category,
        tags: input.tags ?? [],
        description: input.description,
      }),
      product_status: targetStatus,
      price: input.price,
    })
    .eq("product_id", input.productId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/seller/assets");
  revalidatePath("/seller/view-assets");
  return { error: null };
}

/**
 * Uploads to Storage with the service role after verifying the seller owns the product.
 * Browser uploads use the anon key and are blocked by Storage RLS unless policies match every path.
 */
export async function uploadSellerProductMedia(
  productId: string,
  formData: FormData,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const uid = claimsData?.claims?.sub;
  if (!uid) {
    return { error: "Not signed in" };
  }

  const { data: owned, error: rowError } = await supabase
    .from("products")
    .select("product_id")
    .eq("product_id", productId)
    .eq("seller_owner_id", uid)
    .maybeSingle();

  if (rowError) {
    return { error: rowError.message };
  }
  if (!owned) {
    return { error: "Product not found or access denied" };
  }

  const coverRaw = formData.get("cover");
  const cover =
    coverRaw instanceof File && coverRaw.size > 0 ? coverRaw : null;

  const detailParts = formData.getAll("details");
  const detailFiles = detailParts.filter(
    (entry): entry is File => entry instanceof File && entry.size > 0,
  );

  const packageRaw = formData.get("package");
  const packageFile =
    packageRaw instanceof File && packageRaw.size > 0 ? packageRaw : null;

  if (packageFile) {
    if (!isAllowedPackageFile(packageFile)) {
      return {
        error:
          "Invalid package file type. Use allowed archive/model formats only.",
      };
    }
    if (packageFile.size > MAX_PACKAGE_FILE_BYTES) {
      return {
        error: `Package file exceeds maximum size (${MAX_PACKAGE_FILE_BYTES / (1024 * 1024)} MB).`,
      };
    }
  }

  if (!cover && detailFiles.length === 0 && !packageFile) {
    return { error: null };
  }

  try {
    const admin = createAdminClient();

    if (packageFile) {
      const pkgErr = await uploadSellerPackageFile(
        admin,
        productId,
        packageFile,
      );
      if (pkgErr.error) return pkgErr;
    }

    return uploadSellerAssetPhotos(admin, productId, {
      cover,
      detailFiles,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Server upload configuration error";
    return { error: message };
  }
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

  const { data: owned, error: checkError } = await supabase
    .from("products")
    .select("product_id")
    .eq("product_id", productId)
    .eq("seller_owner_id", uid)
    .maybeSingle();

  if (checkError) {
    return { error: checkError.message };
  }
  if (!owned) {
    return { error: "Product not found or access denied" };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("products")
      .delete()
      .eq("product_id", productId);
    if (error) {
      return { error: error.message };
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Server configuration error";
    return { error: message };
  }

  revalidatePath("/seller/assets");
  revalidatePath("/seller/view-assets");
  return { error: null };
}

export async function getSellerProductMediaSummary(
  productId: string,
): Promise<{ data: SellerProductMediaSummary | null; error: string | null }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const uid = claimsData?.claims?.sub;
  if (!uid) {
    return { data: null, error: "Not signed in" };
  }

  const { data: owned, error: ownershipError } = await supabase
    .from("products")
    .select("product_id")
    .eq("product_id", productId)
    .eq("seller_owner_id", uid)
    .maybeSingle();

  if (ownershipError) {
    return { data: null, error: ownershipError.message };
  }
  if (!owned) {
    return { data: null, error: "Product not found or access denied" };
  }

  try {
    const admin = createAdminClient();
    const [
      { data: photoRows, error: photoError },
      { data: thumbnailRows, error: thumbnailError },
      { data: packageRows, error: packageError },
    ] =
      await Promise.all([
        admin.storage.from(ASSET_PHOTOS_BUCKET).list(`${productId}/photos`, {
          limit: 200,
          sortBy: { column: "name", order: "asc" },
        }),
        admin
          .storage.from(ASSET_PHOTOS_BUCKET)
          .list(`${productId}/photos/thumbnail`, {
            limit: 20,
            sortBy: { column: "name", order: "asc" },
          }),
        admin.storage.from(ASSETS_STORAGE_BUCKET).list(productId, {
          limit: 100,
          sortBy: { column: "name", order: "asc" },
        }),
      ]);

    if (photoError) {
      return { data: null, error: photoError.message };
    }
    if (packageError) {
      return { data: null, error: packageError.message };
    }
    if (thumbnailError) {
      return { data: null, error: thumbnailError.message };
    }

    const rows = photoRows ?? [];
    const thumbnailFiles = thumbnailRows ?? [];
    const hasCover = thumbnailFiles.length > 0;
    const detailCount = rows.filter((r) => r.name !== "thumbnail").length;
    const detailUrls = rows
      .filter((r) => r.name !== "thumbnail")
      .map((r) => r.name)
      .filter((name) => /\.(png|jpe?g|webp|gif|avif)$/i.test(name))
      .slice(0, 12)
      .map((name) => {
        const { data } = admin.storage
          .from(ASSET_PHOTOS_BUCKET)
          .getPublicUrl(`${productId}/photos/${name}`);
        return data.publicUrl;
      });
    const packageFileNames = (packageRows ?? []).map((r) => r.name);
    const coverUrl =
      thumbnailFiles.length > 0
        ? admin.storage
          .from(ASSET_PHOTOS_BUCKET)
          .getPublicUrl(`${productId}/photos/thumbnail/${thumbnailFiles[0].name}`)
          .data.publicUrl
        : null;

    return {
      data: {
        hasCover,
        detailCount,
        hasPackage: packageFileNames.length > 0,
        packageFileNames,
        coverUrl,
        detailUrls,
      },
      error: null,
    };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Server storage configuration error";
    return { data: null, error: message };
  }
}

export async function getSellerPackageDownloadUrl(
  productId: string,
): Promise<{ url: string | null; fileName: string | null; error: string | null }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const uid = claimsData?.claims?.sub;
  if (!uid) {
    return { url: null, fileName: null, error: "Not signed in" };
  }

  const { data: owned, error: ownershipError } = await supabase
    .from("products")
    .select("product_id")
    .eq("product_id", productId)
    .eq("seller_owner_id", uid)
    .maybeSingle();

  if (ownershipError) {
    return { url: null, fileName: null, error: ownershipError.message };
  }
  if (!owned) {
    return { url: null, fileName: null, error: "Product not found or access denied" };
  }

  try {
    const admin = createAdminClient();
    const { data: packageRows, error: packageError } = await admin.storage
      .from(ASSETS_STORAGE_BUCKET)
      .list(productId, { limit: 100, sortBy: { column: "name", order: "asc" } });

    if (packageError) {
      return { url: null, fileName: null, error: packageError.message };
    }
    const fileName = packageRows?.[0]?.name ? String(packageRows[0].name) : null;
    if (!fileName) {
      return { url: null, fileName: null, error: null };
    }

    const { data: signed, error: signErr } = await admin.storage
      .from(ASSETS_STORAGE_BUCKET)
      .createSignedUrl(`${productId}/${fileName}`, 60 * 10);

    if (signErr) {
      return { url: null, fileName, error: signErr.message };
    }

    return { url: signed?.signedUrl ?? null, fileName, error: null };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Server storage configuration error";
    return { url: null, fileName: null, error: message };
  }
}
