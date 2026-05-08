import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/products/ProductCard";
import { createAdminClient } from "@/lib/supabase/admin";
import { ASSET_PHOTOS_BUCKET } from "@/lib/seller/asset-storage";
import { Heart, PackageOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function BuyerFavoritesPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null; // Should be handled by middleware, but safe fallback
  }

  // 1. Fetch favorite product IDs
  const { data: favorites, error: favError } = await admin
    .from("favorites")
    .select("product_id")
    .eq("user_id", user.id);

  if (favError) {
    console.error("Error fetching favorites:", favError.message || favError);
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
          <Heart className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Couldn't load wishlist</h2>
        <p className="text-muted-foreground max-w-sm">
          We encountered an error while trying to retrieve your liked products.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/product-listing">Browse All Products</Link>
        </Button>
      </div>
    );
  }

  const productIds = favorites?.map((f) => String(f.product_id)).filter(Boolean) || [];

  // Filter out invalid UUIDs to prevent crash
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const validProductIds = productIds.filter(id => uuidRegex.test(id));

  if (validProductIds.length === 0) {
    if (productIds.length > 0) {
      console.warn("Filtered out non-UUID product IDs from favorites:", productIds.filter(id => !uuidRegex.test(id)));
    }
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-2">
          <Heart className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Your wishlist is empty</h2>
        <p className="text-muted-foreground max-w-sm">
          Save items you're interested in by clicking the heart icon on any product.
        </p>
        <Button asChild className="mt-2">
          <Link href="/product-listing">Browse Products</Link>
        </Button>
      </div>
    );
  }

  // 2. Fetch product details
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("*, categories(name)")
    .in("product_id", validProductIds);

  if (productsError) {
    console.error("Error fetching products:", productsError.message || productsError);
    // Return a friendly error state instead of crashing or logging empty objects
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
          <PackageOpen className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
        <p className="text-muted-foreground max-w-sm">
          We couldn't load your favorite products right now. Please try again later.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/buyer/account">Back to Account</Link>
        </Button>
      </div>
    );
  }

  const finalProducts = products || [];

  if (finalProducts.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-2">
          <PackageOpen className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">No products found</h2>
        <p className="text-muted-foreground max-w-sm">
          The items you liked might have been removed or are no longer available.
        </p>
        <Button asChild className="mt-4">
          <Link href="/product-listing">Discover New Products</Link>
        </Button>
      </div>
    );
  }

  // 3. Map products to ProductCard props
  const mappedProducts = await Promise.all(
    finalProducts.map(async (p) => {
      // Get rating
      const { data: reviews } = await admin
        .from("reviews")
        .select("rating")
        .eq("product_id", p.product_id);

      const rating = reviews?.length
        ? reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviews.length
        : 0;

      // Get thumbnail
      const pid = p.product_id;
      const { data: files } = await admin.storage
        .from(ASSET_PHOTOS_BUCKET)
        .list(`${pid}/photos/thumbnail`);

      let imageSrc = "/pithos/PithosThumbnail.png";
      if (files && files.length > 0) {
        const { data: pubUrl } = admin.storage
          .from(ASSET_PHOTOS_BUCKET)
          .getPublicUrl(`${pid}/photos/thumbnail/${files[0].name}`);
        if (pubUrl.publicUrl) imageSrc = pubUrl.publicUrl;
      }

      // Get seller name
      let author = "Unknown seller";
      if (p.seller_owner_id) {
        const { data: seller } = await admin
          .from("users")
          .select("user_fullname, user_email")
          .eq("id", p.seller_owner_id)
          .single();

        if (seller) {
          author = seller.user_fullname || seller.user_email?.split("@")[0] || "Unknown seller";
        }
      }

      return {
        id: p.product_id,
        title: p.product_name || "Untitled Product",
        subtitle: p.product_name || "Untitled Product",
        rating: parseFloat(rating.toFixed(1)),
        reviews: reviews?.length || 0,
        author,
        price: p.price <= 0 ? "Free" : `₱${p.price.toLocaleString()}`,
        imageSrc,
        category: p.categories?.name || "Asset",
        link: `/product-detail/${p.product_id}`,
      };
    })
  );

  return (
    <div className="flex flex-col gap-8 py-8 px-4 md:px-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2 border-b border-muted pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Liked Products</h1>
        <p className="text-muted-foreground">
          Manage and view all the items you've saved to your wishlist.
        </p>
        <div className="flex items-center gap-4 mt-2">
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
            {finalProducts.length} {finalProducts.length === 1 ? "Item" : "Items"}
          </div>
        </div>
      </div>

      {/* PRODUCT GRID */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mappedProducts.map((product) => (
          <div key={product.id} className="relative group">
            <ProductCard
              title={product.title}
              subtitle={product.subtitle}
              rating={product.rating}
              reviews={product.reviews}
              author={product.author}
              price={product.price}
              imageSrc={product.imageSrc}
              category={product.category}
              link={product.link}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
