"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import UploadAssetForm from "@/components/seller/UploadAssetForm";
import type { UploadFormInitialValues } from "@/components/seller/UploadAssetForm";
import AssetsGrid from "@/components/seller/AssetsGrid";
import { sellerAssetCategories } from "@/components/seller/seller-assets";
import type { AssetItem } from "@/components/seller/seller-assets";
import {
  createSellerProduct,
  deleteSellerProduct,
  updateSellerProduct,
  uploadSellerProductMedia,
} from "@/app/(main)/(protected)/seller/assets/actions";
import type {
  SellerUploadMedia,
  UploadAssetSavePayload,
} from "@/components/seller/UploadAssetForm";
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
  const [editingProductId, setEditingProductId] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const categories = sellerAssetCategories.slice(1);

  const categoryFilterOptions = useMemo(() => {
    const fromData = new Set(
      initialAssets.map((a) => a.category).filter(Boolean),
    );
    return ["All Assets", ...Array.from(fromData).sort()];
  }, [initialAssets]);

  const uploadInitialValues = useMemo((): UploadFormInitialValues | null => {
    if (!editingProductId) return null;
    const asset = initialAssets.find((a) => a.id === editingProductId);
    if (!asset) return null;
    const cat =
      categories.includes(asset.category) ? asset.category : categories[0] ?? "";
    return {
      title: asset.title,
      price: Number.isFinite(asset.price) ? String(asset.price) : "",
      category: cat,
      tags: "",
      description: asset.description ?? "",
    };
  }, [editingProductId, initialAssets, categories]);

  const appendMediaToFormData = (
    media: SellerUploadMedia,
    packageFile: File | null,
  ) => {
    const fd = new FormData();
    if (media.cover) {
      fd.append("cover", media.cover);
    }
    for (const file of media.detailFiles) {
      fd.append("details", file);
    }
    if (packageFile) {
      fd.append("package", packageFile);
    }
    return fd;
  };

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
          <Button
            onClick={() => {
              setEditingProductId(null);
              setActiveTab("upload");
            }}
          >
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

      {activeTab === "upload" &&
        editingProductId &&
        uploadInitialValues === null ? (
        <p className="text-sm text-destructive" role="alert">
          Could not load this asset to edit. Return to the grid or refresh the page.
        </p>
      ) : null}

      {activeTab === "upload" &&
        !(editingProductId && uploadInitialValues === null) && (
        <UploadAssetForm
          key={editingProductId ?? "create-new"}
          categories={categories}
          disabled={isPending}
          editingProductId={editingProductId}
          initialValues={uploadInitialValues}
          onCancelEdit={() => {
            setEditingProductId(null);
            setActiveTab("grid");
          }}
          onSave={async (
            payload: UploadAssetSavePayload,
            isDraft,
            media: SellerUploadMedia,
            packageFile: File | null,
          ) => {
            if (editingProductId) {
              const { error } = await updateSellerProduct({
                productId: editingProductId,
                title: payload.title,
                price: Number.isFinite(payload.price) ? payload.price : 0,
                category: payload.category,
                description: payload.description,
                isDraft,
              });
              if (error) {
                throw new Error(error);
              }

              const hasUpload =
                packageFile != null ||
                media.cover != null ||
                media.detailFiles.length > 0;
              if (hasUpload) {
                const fd = appendMediaToFormData(media, packageFile);
                const { error: uploadError } =
                  await uploadSellerProductMedia(editingProductId, fd);
                if (uploadError) {
                  throw new Error(
                    `Listing updated but file upload failed: ${uploadError}`,
                  );
                }
              }

              setEditingProductId(null);
            } else {
              const { error, productId } = await createSellerProduct({
                title: payload.title,
                price: Number.isFinite(payload.price) ? payload.price : 0,
                category: payload.category,
                description: payload.description,
                isDraft,
              });
              if (error || !productId) {
                throw new Error(error ?? "Could not create product");
              }

              const hasUpload =
                packageFile != null ||
                media.cover != null ||
                media.detailFiles.length > 0;
              if (hasUpload) {
                const fd = appendMediaToFormData(media, packageFile);
                const { error: uploadError } =
                  await uploadSellerProductMedia(productId, fd);
                if (uploadError) {
                  throw new Error(
                    `Listing saved but upload failed: ${uploadError}`,
                  );
                }
              }
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
          onAddNew={() => {
            setEditingProductId(null);
            setActiveTab("upload");
          }}
          onEdit={(asset) => {
            setEditingProductId(asset.id);
            setActiveTab("upload");
          }}
          onDelete={(id) => {
            if (
              !confirm(
                "Delete this asset? The listing will be removed. Storage files may remain until cleaned up.",
              )
            ) {
              return;
            }
            startTransition(async () => {
              const { error } = await deleteSellerProduct(id);
              if (error) {
                console.error(error);
                alert(error);
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
