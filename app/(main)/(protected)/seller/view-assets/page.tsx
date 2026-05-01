import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getSellerProductById } from "@/lib/seller/products";
import ViewAssetDetail from "@/components/seller/ViewAssetDetail";
import { Suspense } from "react";

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ViewAssetPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = params.id;

  if (!id) {
    return (
      <Suspense>
      <div className="p-6 flex flex-col gap-4">
        <p className="text-muted-foreground">
          No product selected. Open a product from My Assets.
        </p>
        <Button asChild variant="outline" className="w-fit">
          <Link
            href="/seller/assets"
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to My Assets
          </Link>
        </Button>
      </div>
      </Suspense>
    );
  }

  const { product, error } = await getSellerProductById(id);

  if (error) {
    return (
      <Suspense>
      <div className="p-6">
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
        <Button asChild variant="outline" className="mt-4 w-fit">
          <Link href="/seller/assets">Back to My Assets</Link>
        </Button>
      </div>
    </Suspense>
    );
  }

  if (!product) {
    return (
      <div className="p-6 flex flex-col gap-4">
        <p className="text-muted-foreground">Asset not found or you do not have access.</p>
        <Button asChild className="w-fit">
          <Link href="/seller/assets">Back to My Assets</Link>
        </Button>
      </div>
    );
  }

  return (
  <Suspense>
    <ViewAssetDetail asset={product} />
  </Suspense> );
}
