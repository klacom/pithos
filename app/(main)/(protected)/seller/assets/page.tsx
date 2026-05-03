import { Suspense } from "react";
import AssetsPageClient from "@/components/seller/AssetsPageClient";
import {
  listSellerProductRows,
  productRowToAssetItem,
} from "@/lib/seller/products";

function AssetsPageFallback() {
  return (
    <div className="flex flex-col p-4 gap-4 w-full h-full">
      <div className="flex justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-9 w-48 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-72 rounded-md bg-muted/80 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded-md bg-muted animate-pulse" />
          <div className="h-10 w-32 rounded-md bg-muted animate-pulse" />
        </div>
      </div>
      <div className="h-px bg-border" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-56 rounded-lg border border-muted bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

async function SellerAssetsContent() {
  const { rows, error } = await listSellerProductRows();
  const initialAssets = rows.map(productRowToAssetItem);
  return (
    <AssetsPageClient initialAssets={initialAssets} loadError={error} />
  );
}

export default function SellerAssetsPage() {
  return (
    <Suspense fallback={<AssetsPageFallback />}>
      <SellerAssetsContent />
    </Suspense>
  );
}
