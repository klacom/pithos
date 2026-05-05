import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getSellerProductById } from "@/lib/seller/products";
import ViewAssetDetail from "@/components/seller/ViewAssetDetail";
import { Suspense } from "react";
import {
  getSellerPackageDownloadUrl,
  getSellerProductMediaSummary,
} from "@/app/(main)/(protected)/seller/assets/actions";

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ViewAssetPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<ViewAssetLoadingState />}>
      <ViewAssetPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ViewAssetPageContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = params.id;

  if (!id) {
    return (
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
    );
  }

  const { product, error } = await getSellerProductById(id);

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
        <Button asChild variant="outline" className="mt-4 w-fit">
          <Link href="/seller/assets">Back to My Assets</Link>
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 flex flex-col gap-4">
        <p className="text-muted-foreground">
          Asset not found or you do not have access.
        </p>
        <Button asChild className="w-fit">
          <Link href="/seller/assets">Back to My Assets</Link>
        </Button>
      </div>
    );
  }

  const [{ data: media }, pkg] = await Promise.all([
    getSellerProductMediaSummary(id),
    getSellerPackageDownloadUrl(id),
  ]);

  return (
    <ViewAssetDetail
      asset={product}
      media={{
        coverUrl: media?.coverUrl ?? null,
        detailUrls: media?.detailUrls ?? [],
        packageFileNames: media?.packageFileNames ?? [],
        packageDownloadUrl: pkg.url,
        packageDownloadName: pkg.fileName,
      }}
    />
  );
}

function ViewAssetLoadingState() {
  return (
    <div className="p-6 flex flex-col gap-3">
      <div className="h-5 w-44 rounded bg-muted animate-pulse" />
      <div className="h-4 w-72 rounded bg-muted/70 animate-pulse" />
      <div className="h-4 w-64 rounded bg-muted/70 animate-pulse" />
    </div>
  );
}
