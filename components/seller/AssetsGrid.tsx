"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Grid, List, Plus } from "lucide-react";
import AssetCard from "@/components/seller/AssetsCard";
import type { AssetItem } from "@/components/seller/seller-assets";

type AssetsGridProps = {
  assets: AssetItem[];
  categories: string[];
  onDelete?: (id: string) => void;
  onEdit?: (asset: AssetItem) => void;
  onAddNew?: () => void;
};

export default function AssetsGrid({
  assets,
  categories,
  onDelete,
  onEdit,
  onAddNew,
}: AssetsGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("All Assets");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredAssets = assets.filter((asset) => {
    const matchCategory =
      selectedCategory === "All Assets" ||
      asset.category === selectedCategory;

    const matchSearch =
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchSearch;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* FILTER BAR */}
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm ${
                selectedCategory === cat
                  ? "bg-accent text-white"
                  : "bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-2 top-2" />
            <Input
              className="pl-7 w-48"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button size="icon" variant="outline">
            <Filter size={16} />
          </Button>

          <Button
            size="icon"
            variant="outline"
            onClick={() =>
              setViewMode(viewMode === "grid" ? "list" : "grid")
            }
          >
            {viewMode === "grid" ? <List size={16} /> : <Grid size={16} />}
          </Button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAssets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}

        {/* ADD CARD */}
        <button
          type="button"
          onClick={() => onAddNew?.()}
          className="border-dashed border-2 rounded-lg flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:bg-muted/30 transition-colors text-left"
        >
          <Plus size={32} />
          <p>Add New Asset</p>
        </button>
      </div>
    </div>
  );
}