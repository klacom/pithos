"use client";

import { Button } from "@/components/ui/button";
import { Eye, FileText, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  formatPhpPrice,
  type AssetItem,
} from "@/components/seller/seller-assets";

type Props = { asset: AssetItem };

export default function ViewAssetDetail({ asset }: Props) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Button asChild variant="ghost" className="w-fit">
        <Link
          href="/seller/assets"
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Assets
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold">{asset.title}</h1>
        <p className="text-sm text-muted-foreground">
          {asset.category} • {asset.status} • {asset.date}
        </p>
      </div>

      <div className="w-full aspect-video bg-muted rounded-xl flex items-center justify-center">
        <span className="text-muted-foreground">Asset Preview</span>
      </div>

      <div className="flex gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <Eye size={16} /> {asset.views} views
        </span>
        <span className="flex items-center gap-2">
          <FileText size={16} /> {asset.downloads} downloads
        </span>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <span className="text-2xl font-bold">
          {formatPhpPrice(asset.price)}
        </span>

        <Button className="flex gap-2" type="button">
          <Download size={16} />
          Download / Buy
        </Button>
      </div>

      <div className="border-t pt-4">
        <h2 className="font-semibold mb-2">Description</h2>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {asset.description?.trim() ? asset.description : "No description provided."}
        </p>
      </div>
    </div>
  );
}
