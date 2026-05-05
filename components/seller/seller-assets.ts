export type AssetStatus = "Published" | "Draft" | "Archived";

const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `id` is the Supabase `products.product_id` (uuid). */
export type AssetItem = {
  id: string;
  title: string;
  price: number;
  status: AssetStatus;
  coverImageUrl?: string | null;
  /** Placeholder while analytics are not wired to the DB. */
  views: number;
  /** Placeholder while analytics are not wired to the DB. */
  downloads: number;
  date: string;
  category: string;
  tags?: string[];
  /** Parsed from `product_description` (without draft/category envelope). */
  description?: string;
};

export const sellerAssetCategories = [
  "All Assets",
  "3D Models",
  "Textures",
  "Environments",
  "Weapons",
  "Characters",
  "Nature",
  "UI Kits",
];

export function formatPhpPrice(price: number) {
  return phpFormatter.format(price);
}
