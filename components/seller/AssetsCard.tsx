"use client";

import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, FileText, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  formatPhpPrice,
  type AssetItem,
} from "@/components/seller/seller-assets";

type Props = {
  asset: AssetItem;
  onEdit?: (asset: AssetItem) => void;
  onDelete?: (id: string) => void;
};

export default function AssetCard({ asset, onEdit, onDelete }: Props) {
  const router = useRouter();

  const handleView = () => {
    router.push(`/seller/view-assets?id=${asset.id}`);
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-background hover:shadow-md transition">

      {/* IMAGE / PREVIEW */}
      <div
        className="relative aspect-video bg-muted flex items-center justify-center cursor-pointer"
        onClick={handleView}
      >
        {asset.coverImageUrl ? (
          <Image
            src={asset.coverImageUrl}
            alt={`${asset.title} cover`}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <ImageIcon className="opacity-50" />
        )}
      </div>

      {/* CONTENT */}
      <div className="p-4 flex flex-col gap-2">

        {/* TITLE */}
        <div onClick={handleView} className="cursor-pointer">
          <h3 className="font-medium truncate">{asset.title}</h3>
          <p className="text-xs text-muted-foreground">{asset.category}</p>
        </div>

        {/* PRICE + ACTIONS */}
        <div className="flex justify-between items-center">
          <span className="font-bold text-sm">
            {formatPhpPrice(asset.price)}
          </span>

          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleView();
              }}
            >
              <Eye size={14} />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(asset);
              }}
            >
              <Edit size={14} />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(asset.id);
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* STATS */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye size={12} /> {asset.views}
          </span>
          <span className="flex items-center gap-1">
            <FileText size={12} /> {asset.downloads}
          </span>
        </div>

        {/* STATUS */}
        <div>
          <span
            className={`text-[10px] px-2 py-1 rounded-full ${
              asset.status === "Published"
                ? "bg-green-500/20 text-green-600"
                : asset.status === "Draft"
                  ? "bg-yellow-500/20 text-yellow-600"
                  : "bg-zinc-500/20 text-zinc-600"
            }`}
          >
            {asset.status}
          </span>
        </div>

      </div>
    </div>
  );
}