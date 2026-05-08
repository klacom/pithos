import { ProductCard } from "@/components/products/ProductCard"
import { createAdminClient } from "@/lib/supabase/admin";
import { ASSET_PHOTOS_BUCKET } from "@/lib/seller/asset-storage";
import ProductListingFilters from "@/components/products/ProductListingFilters";
import { Suspense } from "react";

type ListingProduct = {
  id: string;
  title: string;
  subtitle: string;
  rating: number;
  reviews: number;
  author: string;
  price: string;
  imageSrc: string;
  link: string;
};

const STATIC_FALLBACK: ListingProduct[] = [
  {
    id: "fallback-1",
    title: "Stellar Sci-Fi Pack",
    subtitle: "Character Assets",
    rating: 4.5,
    reviews: 120,
    author: "Lark Bolotaolo",
    price: "$67.00",
    imageSrc: "/sample-pics/458478537_7645885715447813_4009544347800371450_n.jpg",
    link: "/product-detail",
  },
  {
    id: "fallback-2",
    title: "ROCK & BOULDERS 2",
    subtitle: "Rock and Boulders 2",
    rating: 4.7,
    reviews: 611,
    author: "Manufactura K4",
    price: "Free",
    imageSrc: "/sample-pics/427910050_10160735009917626_224300477084609345_n.jpg",
    link: "/product-detail",
  },
  {
    id: "fallback-3",
    title: "Fantasy Props",
    subtitle: "Weapons & Items",
    rating: 4.6,
    reviews: 340,
    author: "Mythic Studio",
    price: "$8",
    imageSrc: "/sample-pics/448095782_7941547522555651_2170753001983639848_n.jpg",
    link: "/product-detail",
  },
];

type ListingCategory = { id: string; name: string };

type ProductFilters = {
  q: string;
  category: string;
  minPrice: number | null;
  maxPrice: number | null;
  onSale: boolean;
  minRating: number | null;
  sort: "relevance" | "newest" | "price_asc" | "price_desc" | "rating_desc";
};

function parseNumber(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function buildProductListingHref(
  params: {
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    onSale?: string;
    minRating?: string;
    sort?: string;
  },
  updates: Array<[key: string, value: string | null]>,
): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === "") continue;
    p.set(k, v);
  }
  for (const [k, v] of updates) {
    if (v == null || v === "") p.delete(k);
    else p.set(k, v);
  }
  const qs = p.toString();
  return qs ? `/product-listing?${qs}` : "/product-listing";
}

async function listCategories(): Promise<ListingCategory[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });
  if (error || !data) {
    if (error) console.error("categories fetch:", error.message);
    return [];
  }
  return (data as Array<{ id: string; name: string }>).map((c) => ({
    id: String(c.id),
    name: String(c.name ?? ""),
  }));
}

async function getRatingStats(productIds: string[]): Promise<
  Map<string, { avg: number; count: number }>
> {
  const admin = createAdminClient();
  if (productIds.length === 0) return new Map();
  const { data, error } = await admin
    .from("reviews")
    .select("product_id, rating")
    .in("product_id", productIds);
  if (error || !data) {
    if (error) console.error("reviews fetch:", error.message);
    return new Map();
  }
  const agg = new Map<string, { sum: number; count: number }>();
  for (const r of data as Array<{ product_id: string | null; rating: number | null }>) {
    const pid = String(r.product_id ?? "");
    if (!pid) continue;
    const num = Number(r.rating);
    if (!Number.isFinite(num)) continue;
    const prev = agg.get(pid) ?? { sum: 0, count: 0 };
    prev.sum += num;
    prev.count += 1;
    agg.set(pid, prev);
  }
  const out = new Map<string, { avg: number; count: number }>();
  for (const [pid, v] of agg) {
    out.set(pid, { avg: v.count > 0 ? v.sum / v.count : 0, count: v.count });
  }
  return out;
}

async function fetchPublishedListingProducts(
  filters: ProductFilters,
  limit: number,
): Promise<ListingProduct[]> {
  const admin = createAdminClient();

  // apply filters
  const term = filters.q.trim();
  let q = admin
    .from("products")
    .select("product_id, product_name, product_description, price, seller_owner_id, created_at, sale_price, category_id")
    .eq("product_status", "published");

  if (term) {
    q = q.or(`product_name.ilike.%${term}%,product_description.ilike.%${term}%`);
  }
  if (filters.category) {
    q = q.eq("category_id", filters.category);
  }
  if (filters.minPrice != null) {
    q = q.gte("price", filters.minPrice);
  }
  if (filters.maxPrice != null) {
    q = q.lte("price", filters.maxPrice);
  }
  if (filters.onSale) {
    // "on sale" is defined as sale_price IS NOT NULL and less than price
    q = q.not("sale_price", "is", null);
  }

  // sorting (rating sort is done after stats are computed)
  if (filters.sort === "newest") {
    q = q.order("created_at", { ascending: false });
  } else if (filters.sort === "price_asc") {
    q = q.order("price", { ascending: true });
  } else if (filters.sort === "price_desc") {
    q = q.order("price", { ascending: false });
  } else {
    q = q.order("created_at", { ascending: false });
  }

  // if we need rating filter/sort, pull more rows to allow client-side rating pruning
  const needsRating = filters.minRating != null || filters.sort === "rating_desc";
  const queryLimit = needsRating ? Math.max(limit * 6, 120) : limit;

  const { data: rows, error: rowErr } = await q.limit(queryLimit);

  if (rowErr || !rows) {
    if (rowErr) console.error("product-listing fetch:", rowErr.message);
    return [];
  }

  const sellerIds = [
    ...new Set(
      rows
        .map((row) => String(row.seller_owner_id ?? ""))
        .filter((v) => v !== ""),
    ),
  ];
  const sellerNameById = new Map<string, string>();
  if (sellerIds.length > 0) {
    const { data: users } = await admin
      .from("users")
      .select("id, user_fullname, user_email")
      .in("id", sellerIds);
    for (const u of users ?? []) {
      const name = String(u.user_fullname || u.user_email?.split("@")[0] || "Unknown seller");
      sellerNameById.set(String(u.id), name);
    }
  }

  const thumbByProductId = new Map<string, string>();
  await Promise.all(
    rows.map(async (row) => {
      const pid = String(row.product_id);
      const { data: thumbs } = await admin.storage
        .from(ASSET_PHOTOS_BUCKET)
        .list(`${pid}/photos/thumbnail`, {
          limit: 20,
          sortBy: { column: "name", order: "asc" },
        });
      const name = thumbs?.[0]?.name;
      if (!name) return;
      const { data: pub } = admin.storage
        .from(ASSET_PHOTOS_BUCKET)
        .getPublicUrl(`${pid}/photos/thumbnail/${name}`);
      if (pub.publicUrl) thumbByProductId.set(pid, pub.publicUrl);
    }),
  );

  const productIds = rows.map((r) => String(r.product_id));
  const ratingById = await getRatingStats(productIds);

  let mapped = rows.map((row) => {
    const price = Number(row.price ?? 0);
    const pid = String(row.product_id);
    const rs = ratingById.get(pid);
    const avgRating = rs?.avg ?? 0;
    const reviewCount = rs?.count ?? 0;
    return {
      id: pid,
      title: String(row.product_name ?? "Untitled Asset"),
      subtitle: String(row.product_name ?? "Untitled Asset"),
      rating: avgRating,
      reviews: reviewCount,
      author: sellerNameById.get(String(row.seller_owner_id ?? "")) ?? "Unknown seller",
      price:
        price <= 0
          ? "Free"
          : new Intl.NumberFormat("en-PH", {
              style: "currency",
              currency: "PHP",
            }).format(price),
      imageSrc: thumbByProductId.get(pid) ?? "/pithos/PithosThumbnail.png",
      link: `/product-detail/${pid}`,
    } satisfies ListingProduct;
  });

  if (filters.onSale) {
    // Note: The primary filtering for onSale is done in the SQL query.
    // This client-side filter is kept as a safeguard if the data structure changes.
    // It assumes that products with a sale_price less than price are on sale.
    // Since sale_price is not currently mapped in ListingProduct, this remains a pass-through.
    mapped = mapped.filter(() => true);
  }

  if (filters.minRating != null) {
    mapped = mapped.filter((p) => p.rating >= filters.minRating!);
  }

  if (filters.sort === "rating_desc") {
    mapped = [...mapped].sort((a, b) => (b.rating - a.rating) || (b.reviews - a.reviews));
  }

  return mapped.slice(0, limit);
}

const page = async ({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    onSale?: string;
    minRating?: string;
    sort?: string;
  }>;
}) => {
  const params = await searchParams;
  const filters: ProductFilters = {
    q: String(params.q ?? "").trim(),
    category: String(params.category ?? ""),
    minPrice: parseNumber(params.minPrice),
    maxPrice: parseNumber(params.maxPrice),
    onSale: String(params.onSale ?? "") === "1",
    minRating: parseNumber(params.minRating),
    sort:
      params.sort === "newest" ||
      params.sort === "price_asc" ||
      params.sort === "price_desc" ||
      params.sort === "rating_desc"
        ? params.sort
        : "relevance",
  };

  const GRID_SIZE = 24;
  const [categories, fetched] = await Promise.all([
    listCategories(),
    fetchPublishedListingProducts(filters, GRID_SIZE),
  ]);

  const slots: ListingProduct[] = [...fetched];

  const selectedCategoryName =
    filters.category
      ? categories.find((c) => c.id === filters.category)?.name ?? "Category"
      : "All Categories";

  const activeChips: Array<{ label: string; href: string }> = [];
  if (filters.q) {
    activeChips.push({
      label: `Search: “${filters.q}”`,
      href: buildProductListingHref(params, [["q", null]]),
    });
  }
  if (filters.category) {
    activeChips.push({
      label: `Category: ${selectedCategoryName}`,
      href: buildProductListingHref(params, [["category", null]]),
    });
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    const a = filters.minPrice != null ? filters.minPrice : 0;
    const b = filters.maxPrice != null ? filters.maxPrice : "∞";
    activeChips.push({
      label: `Price: ${a}–${b}`,
      href: buildProductListingHref(params, [
        ["minPrice", null],
        ["maxPrice", null],
      ]),
    });
  }
  if (filters.onSale) {
    activeChips.push({
      label: "On sale",
      href: buildProductListingHref(params, [["onSale", null]]),
    });
  }
  if (filters.minRating != null) {
    activeChips.push({
      label: `Rating: ${filters.minRating}★+`,
      href: buildProductListingHref(params, [["minRating", null]]),
    });
  }
  if (filters.sort !== "relevance") {
    const label =
      filters.sort === "newest"
        ? "Sort: Newest"
        : filters.sort === "price_asc"
          ? "Sort: Price (low→high)"
          : filters.sort === "price_desc"
            ? "Sort: Price (high→low)"
            : "Sort: Rating";
    activeChips.push({
      label,
      href: buildProductListingHref(params, [["sort", null]]),
    });
  }

  return (
    <main className="flex flex-col gap-8 px-4 md:px-20 lg:px-40 xl:px-60 2xl:px-80 w-full mb-4">

      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.25em] text-accent">
          Category
        </p>

        <h1 className="text-3xl lg:text-4xl font-bold">
          {selectedCategoryName}{" "}
          <span className="text-muted-foreground font-normal">
            {filters.category ? "category" : ""}
          </span>
        </h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="text-muted-foreground">
            {slots.length} {slots.length === 1 ? "result" : "results"}
          </span>

          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-green-600 dark:text-green-400 font-medium">active</span>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col gap-4 border-b pb-6">

        <p className="text-sm text-muted-foreground">
          {filters.q ? (
            <>
              Showing available items for{" "}
              <span className="text-white font-medium">&quot;{filters.q}&quot;</span>
              <a
                href="/product-listing"
                className="ml-2 underline underline-offset-4 hover:text-foreground"
              >
                Clear
              </a>
            </>
          ) : (
            <>
              Showing all <span className="text-primary font-medium">available</span> items
            </>
          )}
        </p>

        <Suspense fallback={<div className="h-20 bg-secondary/20 animate-pulse rounded-lg" />}>
          <ProductListingFilters
            categories={categories}
            value={{
              q: filters.q,
              category: filters.category,
              minPrice: params.minPrice ?? "",
              maxPrice: params.maxPrice ?? "",
              onSale: filters.onSale,
              minRating: filters.minRating != null ? String(filters.minRating) : "",
              sort: filters.sort,
            }}
          />
        </Suspense>

        {activeChips.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <a
                key={chip.label}
                href={chip.href}
                className="px-3 py-1 text-xs rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                title="Remove filter"
              >
                {chip.label} ✕
              </a>
            ))}
          </div>
        ) : null}

      </div>

      {/* PRODUCT GRID */}
      {slots.length === 0 ? (
        <div className="rounded-lg border border-muted p-8 text-center text-muted-foreground">
          No available items match your search.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {slots.map((item) => (
            <ProductCard
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              rating={item.rating}
              reviews={item.reviews}
              author={item.author}
              price={item.price}
              imageSrc={item.imageSrc}
              link={item.link}
            />
          ))}

        </div>
      )}

    </main>
  )
}

export default page