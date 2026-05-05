"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import SellerAssetPhotoPickers, {
  type DetailSlot,
} from "@/components/seller/SellerAssetPhotoPickers";
import {
  ALLOWED_PACKAGE_EXTENSIONS,
  formatMaxPackageSizeLabel,
  isAllowedPackageFile,
  MAX_PACKAGE_FILE_BYTES,
  packageFileAcceptAttribute,
} from "@/lib/seller/package-upload-rules";
import { Upload, DollarSign, Tag, Layers, X } from "lucide-react";

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

export type SellerUploadMedia = {
  cover: File | null;
  detailFiles: File[];
};

export type UploadFormInitialValues = {
  title: string;
  price: string;
  category: string;
  tags: string;
  description: string;
};

type Props = {
  categories: string[];
  onSave: (
    data: UploadAssetSavePayload,
    isDraft: boolean,
    media: SellerUploadMedia,
    packageFile: File | null,
  ) => void | Promise<void>;
  disabled?: boolean;
  /** When set, saves call `updateSellerProduct` + uploads instead of create. */
  editingProductId?: string | null;
  initialValues?: UploadFormInitialValues | null;
  existingMediaSummary?: ExistingMediaSummary | null;
  onCancelEdit?: () => void;
};

type ExistingMediaSummary = {
  hasCover: boolean;
  detailCount: number;
  hasPackage: boolean;
  packageFileNames: string[];
  coverUrl: string | null;
  detailUrls: string[];
};

function emptyForm(categories: string[]): AssetFormState {
  return {
    title: "",
    price: "",
    category: categories[0] ?? "",
    tags: "",
    description: "",
  };
}

export default function UploadAssetForm({
  categories,
  onSave,
  disabled = false,
  editingProductId = null,
  initialValues = null,
  existingMediaSummary = null,
  onCancelEdit,
}: Props) {
  const [formData, setFormData] = useState<AssetFormState>(() =>
    initialValues
      ? {
          title: initialValues.title,
          price: initialValues.price,
          category: initialValues.category,
          tags: initialValues.tags,
          description: initialValues.description,
        }
      : emptyForm(categories),
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [detailSlots, setDetailSlots] = useState<DetailSlot[]>([]);
  const [packageFile, setPackageFile] = useState<File | null>(null);
  const [packageRejectReason, setPackageRejectReason] = useState<string | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const packageInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = Boolean(editingProductId);

  const validateAndSetPackage = useCallback((file: File | null) => {
    setPackageRejectReason(null);
    if (!file) {
      setPackageFile(null);
      return;
    }
    if (!isAllowedPackageFile(file)) {
      setPackageFile(null);
      setPackageRejectReason(
        `Use only: ${ALLOWED_PACKAGE_EXTENSIONS.join(", ")}`,
      );
      return;
    }
    if (file.size > MAX_PACKAGE_FILE_BYTES) {
      setPackageFile(null);
      setPackageRejectReason(
        `File too large (max ${formatMaxPackageSizeLabel()}).`,
      );
      return;
    }
    setPackageFile(file);
  }, []);

  const handlePackageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    validateAndSetPackage(f);
    e.target.value = "";
  };

  const onPackageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSetPackage(f);
  };

  const handleInputChange = (field: keyof AssetFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addDetailFiles = (files: File[]) => {
    setDetailSlots((prev) => [
      ...prev,
      ...files.map((file) => ({ id: crypto.randomUUID(), file })),
    ]);
  };

  const handleSubmit = async (isDraft: boolean) => {
    setSubmitError(null);

    if (!isDraft && !isEditMode && !packageFile) {
      setSubmitError(
        `Add an asset package (${ALLOWED_PACKAGE_EXTENSIONS.slice(0, 6).join(", ")}, …) before publishing.`,
      );
      return;
    }

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

    const media: SellerUploadMedia = {
      cover: coverFile,
      detailFiles: detailSlots.map((s) => s.file),
    };

    setIsSaving(true);
    try {
      await onSave(payload, isDraft, media, packageFile);
      if (!isEditMode) {
        setFormData(emptyForm(categories));
        setCoverFile(null);
        setDetailSlots([]);
        setPackageFile(null);
      } else {
        setPackageFile(null);
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const allowedHint = ALLOWED_PACKAGE_EXTENSIONS.join(", ");
  const savedMedia = isEditMode ? existingMediaSummary : null;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-8 rounded-2xl border border-muted/80 bg-card shadow-sm">
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-2 border-b border-muted/60">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isEditMode ? "Edit your listing" : "List a new asset"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              {isEditMode
                ? "Change text, swap files, or add new previews—save when you're happy."
                : "Take your time: save a draft anytime, or publish when the package and visuals are ready."}
            </p>
          </div>
          {isEditMode && onCancelEdit ? (
            <Button type="button" variant="outline" onClick={onCancelEdit}>
              Cancel
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold">
              Downloadable file{" "}
              {!isEditMode ? (
                <span className="font-normal text-muted-foreground">
                  (needed to publish)
                </span>
              ) : (
                <span className="font-normal text-muted-foreground">
                  (optional — add if you're replacing the file)
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              This is what buyers download—usually a{" "}
              <span className="text-foreground/90">.zip</span> or{" "}
              <span className="text-foreground/90">.blend</span>, or another format
              from the list below. Max size about{" "}
              {formatMaxPackageSizeLabel()} per file.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Formats: {allowedHint}
            </p>
          </div>
          <input
            ref={packageInputRef}
            type="file"
            className="sr-only"
            accept={packageFileAcceptAttribute()}
            disabled={disabled || isSaving}
            onChange={handlePackageInputChange}
          />
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                packageInputRef.current?.click();
            }}
            onClick={() => packageInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={onPackageDrop}
            className="rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/15 p-8 md:p-10 flex flex-col items-center justify-center gap-3 hover:border-accent/60 hover:bg-muted/25 cursor-pointer transition-all min-h-[160px]"
          >
            <div className="rounded-full bg-muted/80 p-3">
              <Upload size={28} className="text-muted-foreground" />
            </div>
            <p className="font-medium text-center text-foreground">
              Drop your file here, or click to choose
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              One file per upload — your main archive or project file
            </p>
          </div>
          {packageRejectReason ? (
            <p className="text-sm text-destructive" role="alert">
              {packageRejectReason}
            </p>
          ) : null}
          {packageFile ? (
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <span className="text-muted-foreground truncate max-w-full">
                Selected: <strong>{packageFile.name}</strong> (
                {(packageFile.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                disabled={disabled || isSaving}
                onClick={(e) => {
                  e.stopPropagation();
                  validateAndSetPackage(null);
                }}
              >
                <X size={14} className="mr-1" />
                Remove
              </Button>
            </div>
          ) : null}
          {isEditMode && !packageFile && existingMediaSummary?.hasPackage ? (
            <p className="text-xs text-muted-foreground">
              Existing package already saved ({existingMediaSummary.packageFileNames.length} file
              {existingMediaSummary.packageFileNames.length === 1 ? "" : "s"}). Uploading a new one
              will add/update the downloadable package.
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">About this listing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 rounded-xl border border-muted/50 bg-muted/10 p-4 md:p-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="e.g. Stylized forest pack"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Price</label>
            <div className="relative">
              <DollarSign
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-8"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Category</label>
            <div className="relative">
              <Layers
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 pl-10 text-sm"
                value={formData.category}
                onChange={(e) =>
                  handleInputChange("category", e.target.value)
                }
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="relative">
              <Tag
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-8"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
                placeholder="e.g. stylized, forest, low poly"
              />
            </div>
          </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Description</label>
          <p className="text-xs text-muted-foreground">
            What's included, specs, and how to use it—buyers read this first.
          </p>
          <textarea
            className="w-full min-h-[130px] rounded-xl border border-input bg-background px-3 py-3 text-sm leading-relaxed shadow-sm placeholder:text-muted-foreground/70"
            value={formData.description}
            onChange={(e) =>
              handleInputChange("description", e.target.value)
            }
            placeholder="Describe meshes, textures, rigging, poly counts, or anything that helps someone decide…"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Preview images</h3>
          <p className="text-sm text-muted-foreground -mt-1 leading-relaxed">
            Cover and gallery shots sell the work—add them before you publish if you can.
          </p>
        {savedMedia?.coverUrl ? (
          <div className="rounded-xl border border-muted/60 bg-muted/10 p-3">
            <p className="text-xs text-muted-foreground mb-2">Current saved cover</p>
            <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border border-muted">
              <Image
                src={savedMedia.coverUrl}
                alt="Saved cover"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        ) : null}
        {savedMedia && savedMedia.detailUrls.length > 0 ? (
          <div className="rounded-xl border border-muted/60 bg-muted/10 p-3">
            <p className="text-xs text-muted-foreground mb-2">
              Current saved gallery ({savedMedia.detailCount})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {savedMedia.detailUrls.slice(0, 6).map((url) => (
                <div key={url} className="relative aspect-video rounded overflow-hidden border border-muted">
                  <Image
                    src={url}
                    alt="Saved gallery item"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <SellerAssetPhotoPickers
          coverFile={coverFile}
          onCoverChange={setCoverFile}
          detailSlots={detailSlots}
          onDetailFilesAdd={addDetailFiles}
          onDetailRemove={(id) =>
            setDetailSlots((prev) => prev.filter((s) => s.id !== id))
          }
          disabled={disabled || isSaving}
        />
        {isEditMode && existingMediaSummary ? (
          <p className="text-xs text-muted-foreground">
            Saved media: {existingMediaSummary.hasCover ? "cover image" : "no cover image"}
            {" · "}
            {existingMediaSummary.detailCount} gallery file
            {existingMediaSummary.detailCount === 1 ? "" : "s"}.
            New uploads are added on top of what is already saved.
          </p>
        ) : null}
        </div>

        {submitError ? (
          <p className="text-sm text-destructive" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-muted/60">
          <Button
            variant="outline"
            disabled={disabled || isSaving}
            onClick={() => handleSubmit(true)}
            className="min-w-[120px]"
          >
            {isEditMode ? "Save as draft" : "Save draft"}
          </Button>
          <Button
            disabled={disabled || isSaving}
            onClick={() => handleSubmit(false)}
            className="min-w-[120px]"
          >
            {isEditMode ? "Publish updates" : "Publish listing"}
          </Button>
        </div>
      </div>
    </div>
  );
}
