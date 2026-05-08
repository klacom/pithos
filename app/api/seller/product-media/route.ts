import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadSellerAssetPhotos } from "@/lib/seller/asset-storage";
import { uploadSellerPackageFile } from "@/lib/seller/asset-package-storage";
import {
  isAllowedPackageFile,
  MAX_PACKAGE_FILE_BYTES,
} from "@/lib/seller/package-upload-rules";
import { validateImageFile, validateImageFiles } from "@/lib/upload-validation";

export async function POST(req: Request) {
  const supabase = await createClient();

  try {
    const { data: claimsData } = await supabase.auth.getClaims();
    const uid = claimsData?.claims?.sub;
    if (!uid) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const formData = await req.formData();
    const productId = String(formData.get("productId") ?? "").trim();
    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const { data: owned, error: rowError } = await supabase
      .from("products")
      .select("product_id")
      .eq("product_id", productId)
      .eq("seller_owner_id", uid)
      .maybeSingle();

    if (rowError) {
      return NextResponse.json({ error: rowError.message }, { status: 400 });
    }
    if (!owned) {
      return NextResponse.json(
        { error: "Product not found or access denied" },
        { status: 403 },
      );
    }

    const coverRaw = formData.get("cover");
    const cover = coverRaw instanceof File && coverRaw.size > 0 ? coverRaw : null;

    const detailParts = formData.getAll("details");
    const detailFiles = detailParts.filter(
      (entry): entry is File => entry instanceof File && entry.size > 0,
    );

    const packageRaw = formData.get("package");
    const packageFile =
      packageRaw instanceof File && packageRaw.size > 0 ? packageRaw : null;

    if (cover) {
      const coverError = validateImageFile(cover);
      if (coverError) {
        return NextResponse.json(
          { error: `Cover image validation failed: ${coverError}` },
          { status: 400 },
        );
      }
    }

    if (detailFiles.length > 0) {
      const detailErrors = validateImageFiles(detailFiles);
      if (detailErrors.length > 0) {
        return NextResponse.json(
          { error: `Detail image validation failed: ${detailErrors.join("; ")}` },
          { status: 400 },
        );
      }
    }

    if (packageFile) {
      if (!isAllowedPackageFile(packageFile)) {
        return NextResponse.json(
          {
            error: "Invalid package file type. Use allowed archive/model formats only.",
          },
          { status: 400 },
        );
      }
      if (packageFile.size > MAX_PACKAGE_FILE_BYTES) {
        return NextResponse.json(
          {
            error: `Package file exceeds maximum size (${MAX_PACKAGE_FILE_BYTES / (1024 * 1024)} MB).`,
          },
          { status: 400 },
        );
      }
    }

    if (!cover && detailFiles.length === 0 && !packageFile) {
      return NextResponse.json({ error: null });
    }

    if (packageFile) {
      const pkgErr = await uploadSellerPackageFile(supabase, productId, packageFile);
      if (pkgErr.error) {
        return NextResponse.json({ error: pkgErr.error }, { status: 500 });
      }
    }

    if (cover || detailFiles.length > 0) {
      const result = await uploadSellerAssetPhotos(supabase, productId, {
        cover,
        detailFiles,
      });
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }

    return NextResponse.json({ error: null });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server upload error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
