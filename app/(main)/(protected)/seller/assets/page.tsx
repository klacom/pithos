import {
  listSellerProductRows,
  productRowToAssetItem,
} from "@/lib/seller/products";
import AssetsPageClient from "@/components/seller/AssetsPageClient";
import { Suspense } from "react";
export default async function Page() {

  const { rows, error } = await listSellerProductRows();
  const initialAssets = rows.map(productRowToAssetItem);
  return (
    <Suspense>
      <AssetsPageClient initialAssets={initialAssets} loadError={error} />
    </Suspense>
  );
}
