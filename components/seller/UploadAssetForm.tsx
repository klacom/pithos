"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Image as ImageIcon, DollarSign, Tag, Layers } from "lucide-react";

type AssetFormState = {
  title: string;
  price: string;
  category: string;
  tags: string;
  description: string;
};

export type UploadAssetSavePayload = {
  title: string;
  price: number;
  category: string;
  tags: string[];
  description: string;
  status: "Draft" | "Published";
  createdAt: string;
};

type Props = {
  categories: string[];
  onSave: (data: UploadAssetSavePayload, isDraft: boolean) => void | Promise<void>;
  disabled?: boolean;
};

export default function UploadAssetForm({
  categories,
  onSave,
  disabled = false,
}: Props) {
  const [formData, setFormData] = useState<AssetFormState>({
    title: "",
    price: "",
    category: categories[0],
    tags: "",
    description: "",
  });

  const handleInputChange = (field: keyof AssetFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (isDraft: boolean) => {
    const payload: UploadAssetSavePayload = {
      ...formData,
      price: parseFloat(formData.price || "0"),
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      status: isDraft ? "Draft" : "Published",
      createdAt: new Date().toISOString(),
    };

    onSave(payload, isDraft);

    // optional reset
    setFormData({
      title: "",
      price: "",
      category: categories[0],
      tags: "",
      description: "",
    });
  };

  return (
    <div className="w-full p-6 bg-primary-foreground border border-muted rounded-lg">
      <div className="flex flex-col gap-6">
        
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Upload New Asset</h2>
          <p className="text-sm text-muted-foreground">
            Share your digital creation
          </p>
        </div>

        {/* File Upload */}
        <div className="border border-dashed border-muted rounded-lg p-8 flex flex-col items-center justify-center gap-3 hover:border-accent cursor-pointer">
          <Upload size={32} className="text-muted-foreground" />
          <p className="font-medium">Drag & drop files</p>
          <p className="text-xs text-muted-foreground">
            .zip, .fbx, .obj, etc (Max 500MB)
          </p>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Asset Title</label>
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter asset name"
            />
          </div>

          {/* Price */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Price</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Category</label>
            <div className="relative">
              <Layers size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 pl-10 text-sm"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="relative">
              <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
                placeholder="3d, fantasy, character"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="w-full min-h-[120px] rounded-md border border-input px-3 py-2 text-sm"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
          />
        </div>

        {/* Cover Image */}
        <div className="border border-dashed border-muted rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer">
          <ImageIcon size={24} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Upload cover image</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => handleSubmit(true)}
          >
            Save Draft
          </Button>
          <Button
            disabled={disabled}
            onClick={() => handleSubmit(false)}
          >
            Publish
          </Button>
        </div>

      </div>
    </div>
  );
}