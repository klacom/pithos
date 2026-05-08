import { NextResponse } from "next/server";
import { ASSETS_STORAGE_BUCKET } from "@/lib/seller/asset-package-storage";
import { ASSET_PHOTOS_BUCKET } from "@/lib/seller/asset-storage";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ product_id: string }> },
) {
  const supabase = createAdminClient();

  try {
    const { product_id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(product_id)) {
      return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 });
    }

    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("product_id", product_id)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const [{ data: user, error: userError }, detailPhotos, thumbnails, packageRows] =
      await Promise.all([
        supabase
          .from("users")
          .select("*")
          .eq("id", product.seller_owner_id)
          .single(),
        supabase.storage.from(ASSET_PHOTOS_BUCKET).list(`${product_id}/photos`, {
          limit: 40,
          sortBy: { column: "name", order: "asc" },
        }),
        supabase.storage.from(ASSET_PHOTOS_BUCKET).list(`${product_id}/photos/thumbnail`, {
          limit: 20,
          sortBy: { column: "name", order: "asc" },
        }),
        supabase.storage.from(ASSETS_STORAGE_BUCKET).list(product_id, {
          limit: 100,
          sortBy: { column: "name", order: "asc" },
        }),
      ]);

    if (userError) {
      console.error("User fetch error:", userError);
    }

    if (detailPhotos.error) {
      console.error("Storage error:", detailPhotos.error);
    }

    const thumbnailUrls =
      thumbnails.data?.map((file) => {
        const { data } = supabase.storage
          .from(ASSET_PHOTOS_BUCKET)
          .getPublicUrl(`${product_id}/photos/thumbnail/${file.name}`);

        return data.publicUrl;
      }) ?? [];

    const detailImageUrls =
      detailPhotos.data
        ?.filter((file) => file.name !== "thumbnail")
        .map((file) => {
          const { data } = supabase.storage
            .from(ASSET_PHOTOS_BUCKET)
            .getPublicUrl(`${product_id}/photos/${file.name}`);

          return data.publicUrl;
        }) ?? [];

    const images = [...detailImageUrls, ...thumbnailUrls].filter(Boolean);
    const packageFileNames =
      packageRows.data?.map((file) => file.name).filter(Boolean) ?? [];

    return NextResponse.json({
      product,
      images: images.length > 0 ? images : ["/pithos/PithosThumbnail.png"],
      packageFileNames,
      user,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
