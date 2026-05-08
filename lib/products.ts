import { SupabaseClient } from "@supabase/supabase-js";
import { ASSET_PHOTOS_BUCKET } from "@/lib/seller/asset-storage";

export type MappedProduct = {
  id: string;
  title: string;
  subtitle: string;
  rating: number;
  reviews: number;
  author: string;
  price: string;
  imageSrc: string;
  link: string;
  category?: string;
};

export async function mapProductRows(
  supabase: SupabaseClient,
  rows: any[]
): Promise<MappedProduct[]> {
  // Fetch categories once to map category_id to name
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name");
  const categoryMap = new Map(categories?.map(c => [c.id, c.name]));

  return Promise.all(
    rows.map(async (row) => {
      const pid = row.product_id;

      // Use the same API endpoint as product detail page for consistency
      const reviewsRes = await fetch(`/api/product/${pid}/reviews`);
      const reviewsData = reviewsRes.ok ? await reviewsRes.json() : { avgRating: 0, reviewCount: 0 };
      
      const rating = Number(reviewsData?.avgRating ?? 0);

      // Get thumbnail URL
      const { data: files } = await supabase.storage
        .from(ASSET_PHOTOS_BUCKET)
        .list(`${pid}/photos/thumbnail`, {
          limit: 1,
          sortBy: { column: "name", order: "asc" },
        });

      let imageSrc = "/pithos/PithosThumbnail.png";
      if (files && files.length > 0) {
        const { data: pubUrl } = supabase.storage
          .from(ASSET_PHOTOS_BUCKET)
          .getPublicUrl(`${pid}/photos/thumbnail/${files[0].name}`);
        if (pubUrl.publicUrl) imageSrc = pubUrl.publicUrl;
      }

      // Get seller name
      let author = "Unknown seller";
      if (row.seller_owner_id) {
        const { data: userData } = await supabase
          .from("users")
          .select("user_fullname, user_email")
          .eq("id", row.seller_owner_id)
          .single();

        if (userData) {
          author = userData.user_fullname || userData.user_email?.split("@")[0] || "Unknown seller";
        }
      }

      return {
        id: pid,
        title: row.product_name,
        subtitle: row.product_name,
        rating,
        reviews: Number(reviewsData?.reviewCount ?? 0),
        author,
        price: row.price <= 0 ? "Free" : `₱${row.price.toLocaleString()}`,
        imageSrc,
        link: `/product-detail/${pid}`,
        category: categoryMap.get(row.category_id) || "Asset",
      };
    })
  );
}
