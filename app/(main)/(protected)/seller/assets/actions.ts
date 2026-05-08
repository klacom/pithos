"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
import {
  validateImageFile,
  validateImageFiles,
  formatMaxImageSizeLabel,
} from "@/lib/upload-validation";
import { sanitizeText, sanitizeHtml } from "@/lib/sanitization";

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
  coverPath: string | null;
  detailUrls: string[];
  detailPaths: string[];
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
      product_name: sanitizeText(input.title.trim()),
      product_description: buildStoredDescription({
        isDraft: input.isDraft,
        category: input.category,
        tags: (input.tags ?? []).map(tag => sanitizeText(tag)),
        description: sanitizeHtml(input.description),
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

  // Audit log for product creation
  try {
    await createAudit({
      action_name: "PRODUCT_CREATED",
      action_description: `Seller created product: ${input.title.trim()} (Status: ${input.isDraft ? 'draft' : 'published'}, Price: ${input.price})`,
      affected_resources: `product:${productId}`,
      actor: uid,
    });
  } catch (auditError) {
    console.error("Audit log failed for product creation:", auditError);
  }

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

  const targetStatus = input.isDraft ? "draft" : "published";
  const { error } = await supabase
    .from("products")
    .update({
      product_name: sanitizeText(input.title.trim()),
      product_description: buildStoredDescription({
        isDraft: input.isDraft,
        category: input.category,
        tags: (input.tags ?? []).map(tag => sanitizeText(tag)),
        description: sanitizeHtml(input.description),
      }),
      product_status: targetStatus,
      price: input.price,
    })
    .eq("product_id", input.productId);
  if (error) {
    return { error: error.message };
  }

  // Audit log for product update
  try {
    await createAudit({
      action_name: "PRODUCT_UPDATED",
      action_description: `Seller updated product ID ${input.productId}: ${input.title.trim()} (Status: ${targetStatus}, Price: ${input.price})`,
      affected_resources: `product:${input.productId}`,
      actor: uid,
    });
  } catch (auditError) {
    console.error("Audit log failed for product update:", auditError);
  }

  revalidatePath("/seller/assets");
  revalidatePath("/seller/view-assets");
  return { error: null };
}

/**
 * Uploads to Storage using the signed-in seller client after verifying ownership.
 * This ensures Storage RLS is enforced instead of bypassed with the service role.
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

  // Validate cover image
  if (cover) {
    const coverError = validateImageFile(cover);
    if (coverError) {
      return { error: `Cover image validation failed: ${coverError}` };
    }
  }

  // Validate detail images
  if (detailFiles.length > 0) {
    const detailErrors = validateImageFiles(detailFiles);
    if (detailErrors.length > 0) {
      return { error: `Detail image validation failed: ${detailErrors.join("; ")}` };
    }
  }

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
    if (packageFile) {
      const pkgErr = await uploadSellerPackageFile(
        supabase,
        productId,
        packageFile,
      );
      if (pkgErr.error) return pkgErr;
    }

    return uploadSellerAssetPhotos(supabase, productId, {
      cover,
      detailFiles,
    });

    // Audit log for media upload (only if successful)
    if (!result.error) {
      try {
        const fileCount = (cover ? 1 : 0) + detailFiles.length + (packageFile ? 1 : 0);
        await createAudit({
          action_name: "PRODUCT_MEDIA_UPLOADED",
          action_description: `Seller uploaded ${fileCount} file(s) to product ID ${productId} (${cover ? 'cover, ' : ''}${detailFiles.length} detail image(s)${packageFile ? ', package file' : ''})`,
          affected_resources: `product:${productId}`,
          actor: uid,
        });
      } catch (auditError) {
        console.error("Audit log failed for media upload:", auditError);
      }
    }
    return result;
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Server upload configuration error";
    return { error: message };
  }
}

export async function archiveSellerProduct(
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
    const { error } = await supabase
      .from("products")
      .update({ product_status: "archived" })
      .eq("product_id", productId);
    if (error) {
      return { error: error.message };
    }

    // Audit log for product deletion
    try {
      await createAudit({
        action_name: "PRODUCT_DELETED",
        action_description: `Seller deleted product ID ${productId}`,
        affected_resources: `product:${productId}`,
        actor: uid,
      });
    } catch (auditError) {
      console.error("Audit log failed for product deletion:", auditError);
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

export async function deleteSellerProductPhoto(
  productId: string,
  objectPath: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const uid = claimsData?.claims?.sub;
  if (!uid) {
    return { error: "Not signed in" };
  }

  const { data: owned, error: ownershipError } = await supabase
    .from("products")
    .select("product_id")
    .eq("product_id", productId)
    .eq("seller_owner_id", uid)
    .maybeSingle();

  if (ownershipError) {
    return { error: ownershipError.message };
  }
  if (!owned) {
    return { error: "Product not found or access denied" };
  }

  const expectedPrefix = `${productId}/photos/`;
  if (!objectPath.startsWith(expectedPrefix)) {
    return { error: "Invalid photo path" };
  }

  const { error } = await supabase.storage
    .from(ASSET_PHOTOS_BUCKET)
    .remove([objectPath]);
  if (error) {
    return { error: error.message };
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
    const [
      { data: photoRows, error: photoError },
      { data: thumbnailRows, error: thumbnailError },
      { data: packageRows, error: packageError },
    ] =
      await Promise.all([
        supabase.storage.from(ASSET_PHOTOS_BUCKET).list(`${productId}/photos`, {
          limit: 200,
          sortBy: { column: "name", order: "asc" },
        }),
        supabase
          .storage.from(ASSET_PHOTOS_BUCKET)
          .list(`${productId}/photos/thumbnail`, {
            limit: 20,
            sortBy: { column: "name", order: "asc" },
          }),
        supabase.storage.from(ASSETS_STORAGE_BUCKET).list(productId, {
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
    const detailFileNames = rows
      .filter((r) => r.name !== "thumbnail")
      .map((r) => r.name)
      .filter((name) => /\.(png|jpe?g|webp|gif|avif)$/i.test(name));
    const detailPaths = detailFileNames
      .slice(0, 12)
      .map((name) => `${productId}/photos/${name}`);
    const detailUrls = detailPaths.map((path) => {
        const { data } = supabase.storage
          .from(ASSET_PHOTOS_BUCKET)
          .getPublicUrl(path);
        return data.publicUrl;
      });
    const packageFileNames = (packageRows ?? []).map((r) => r.name);
    const coverPath =
      thumbnailFiles.length > 0
        ? `${productId}/photos/thumbnail/${thumbnailFiles[0].name}`
        : null;
    const coverUrl = coverPath
      ? supabase.storage
        .from(ASSET_PHOTOS_BUCKET)
        .getPublicUrl(coverPath)
        .data.publicUrl
      : null;

    return {
      data: {
        hasCover,
        detailCount,
        hasPackage: packageFileNames.length > 0,
        packageFileNames,
        coverUrl,
        coverPath,
        detailUrls,
        detailPaths,
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
    const { data: packageRows, error: packageError } = await supabase.storage
      .from(ASSETS_STORAGE_BUCKET)
      .list(productId, { limit: 100, sortBy: { column: "name", order: "asc" } });

    if (packageError) {
      return { url: null, fileName: null, error: packageError.message };
    }
    const fileName = packageRows?.[0]?.name ? String(packageRows[0].name) : null;
    if (!fileName) {
      return { url: null, fileName: null, error: null };
    }

    const { data: signed, error: signErr } = await supabase.storage
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
