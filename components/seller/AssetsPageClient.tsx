"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import UploadAssetForm from "@/components/seller/UploadAssetForm";
import AssetsGrid from "@/components/seller/AssetsGrid";
import { sellerAssetCategories } from "@/components/seller/seller-assets";
import type { AssetItem } from "@/components/seller/seller-assets";
import {
  createSellerProduct,
  deleteSellerProduct,
} from "@/app/(main)/(protected)/seller/assets/actions";
import type { UploadAssetSavePayload } from "@/components/seller/UploadAssetForm";
import { Grid, Plus } from "lucide-react";

type Props = {
  initialAssets: AssetItem[];
  loadError: string | null;
};

export default function AssetsPageClient({
  initialAssets,
  loadError,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"grid" | "upload">("grid");
  const [isPending, startTransition] = useTransition();

  const categoryFilterOptions = useMemo(() => {
    const fromData = new Set(
      initialAssets.map((a) => a.category).filter(Boolean),
    );
    return ["All Assets", ...Array.from(fromData).sort()];
  }, [initialAssets]);

  return (
    <div className="flex flex-col p-4 gap-4 w-full h-full overflow-y-auto">
      <div className="flex justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">My Assets</h1>
          <p className="text-sm text-muted-foreground">
            Upload and manage your digital creations
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab("grid")}>
            <Grid size={16} className="mr-2" />
            My Assets
          </Button>
          <Button onClick={() => setActiveTab("upload")}>
            <Plus size={16} className="mr-2" />
            Upload New
          </Button>
        </div>
      </div>

      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}

      <hr />

      {activeTab === "upload" && (
        <UploadAssetForm
          categories={sellerAssetCategories.slice(1)}
          disabled={isPending}
          onSave={async (payload: UploadAssetSavePayload, isDraft) => {
            const { error } = await createSellerProduct({
              title: payload.title,
              price: Number.isFinite(payload.price) ? payload.price : 0,
              category: payload.category,
              description: payload.description,
              isDraft,
            });
            if (error) {
              console.error(error);
              return;
            }
            startTransition(() => {
              router.refresh();
            });
            setActiveTab("grid");
          }}
        />
      )}

      {activeTab === "grid" && (
        <AssetsGrid
          assets={initialAssets}
          categories={categoryFilterOptions}
          onDelete={(id) => {
            startTransition(async () => {
              const { error } = await deleteSellerProduct(id);
              if (error) {
                console.error(error);
                return;
              }
              router.refresh();
            });
          }}
        />
      )}
    </div>
  );
}
