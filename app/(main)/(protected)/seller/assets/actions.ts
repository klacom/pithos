"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildStoredDescription } from "@/lib/seller/products";
import { uploadSellerAssetPhotos } from "@/lib/seller/asset-storage";
import { uploadSellerPackageFile } from "@/lib/seller/asset-package-storage";
import {
  isAllowedPackageFile,
  MAX_PACKAGE_FILE_BYTES,
} from "@/lib/seller/package-upload-rules";

export type CreateSellerProductInput = {
  title: string;
  price: number;
  category: string;
  description: string;
  isDraft: boolean;
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
  const { data, error } = await supabase
    .from("products")
    .insert({
      product_name: input.title.trim(),
      product_description: buildStoredDescription({
        isDraft: input.isDraft,
        category: input.category,
        description: input.description,
      }),
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
  const { error } = await supabase
    .from("products")
    .update({
      product_name: input.title.trim(),
      product_description: buildStoredDescription({
        isDraft: input.isDraft,
        category: input.category,
        description: input.description,
      }),
      price: input.price,
    })
    .eq("product_id", input.productId)
    .eq("seller_owner_id", uid);
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
