"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ImageIcon, Images, Plus, Trash2 } from "lucide-react";

export type DetailSlot = { id: string; file: File };

type Props = {
  coverFile: File | null;
  onCoverChange: (file: File | null) => void;
  detailSlots: DetailSlot[];
  onDetailFilesAdd: (files: File[]) => void;
  onDetailRemove: (id: string) => void;
  savedCoverUrl?: string | null;
  savedCoverPath?: string | null;
  savedDetailItems?: Array<{ url: string; path: string | null }>;
  savedDetailCount?: number;
  onDeleteSavedPhoto?: (objectPath: string) => void | Promise<void>;
  disabled?: boolean;
};

function isDetailMedia(file: File) {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
}

export default function SellerAssetPhotoPickers({
  coverFile,
  onCoverChange,
  detailSlots,
  onDetailFilesAdd,
  onDetailRemove,
  savedCoverUrl = null,
  savedCoverPath = null,
  savedDetailItems = [],
  savedDetailCount = 0,
  onDeleteSavedPhoto,
  disabled,
}: Props) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null);
  const coverPreviewId = useId();
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const detailPreviewUrls = useDetailPreviewUrls(detailSlots);

  return (
    <div className="flex flex-col gap-10">
      {/* Cover */}
      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Cover image</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            This is the first thing buyers see in search and on your listing.
            A wide 16:9 image works best.
          </p>
        </div>
        {savedCoverUrl ? (
          <div className="rounded-2xl border border-muted/70 bg-background/70 p-3 md:p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current cover image
              </p>
              {savedCoverPath && onDeleteSavedPhoto ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  title="Delete saved cover image"
                  className="h-8 w-8 p-0"
                  disabled={disabled}
                  onClick={() => {
                    if (!confirm("Delete this saved cover image?")) return;
                    void onDeleteSavedPhoto(savedCoverPath);
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              ) : null}
            </div>
            <div className="relative mx-auto aspect-video w-full max-w-md rounded-xl overflow-hidden border border-muted bg-muted/20">
              <Image
                src={savedCoverUrl}
                alt="Saved cover"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        ) : null}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            onCoverChange(f && f.type.startsWith("image/") ? f : null);
            e.target.value = "";
          }}
          aria-describedby={coverPreviewId}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => coverInputRef.current?.click()}
          className="group w-full min-h-[160px] rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-6 flex flex-col items-center justify-center gap-3 hover:border-accent/60 hover:bg-muted/35 transition-all text-left"
        >
          {coverPreviewUrl ? (
            <div className="relative w-full max-h-[280px] aspect-video rounded-xl overflow-hidden bg-muted shadow-inner">
              <Image
                src={coverPreviewUrl}
                alt="Cover preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <>
              <div className="rounded-full bg-muted p-3 group-hover:bg-background/80 transition-colors">
                <ImageIcon size={26} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Choose a cover image
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-sm">
                PNG or JPG · drag and drop works too if your browser supports it
              </p>
            </>
          )}
          {coverFile && (
            <span
              id={coverPreviewId}
              className="text-xs text-muted-foreground truncate max-w-full"
            >
              {coverFile.name}
            </span>
          )}
        </button>
        {coverFile && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            disabled={disabled}
            onClick={() => onCoverChange(null)}
          >
            <Trash2 size={14} className="mr-2" />
            Remove cover
          </Button>
        )}
      </section>

      {/* Gallery */}
      <section className="rounded-2xl border border-muted/70 bg-muted/15 p-4 md:p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <Images size={18} className="opacity-70" aria-hidden />
              Gallery · photos &amp; videos
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Show what buyers get—extra renders, wireframes, turntables, or a
              short preview clip. You can add several files at once.
            </p>
          </div>
        </div>
        {savedDetailItems.length > 0 ? (
          <div className="rounded-2xl border border-muted/70 bg-background/70 p-3 md:p-4 shadow-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current gallery ({savedDetailCount})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {savedDetailItems.slice(0, 6).map((item) => (
                <div
                  key={item.url}
                  className="group relative aspect-video rounded-xl overflow-hidden border border-muted bg-muted/20 shadow-sm"
                >
                  <Image
                    src={item.url}
                    alt="Saved gallery item"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {item.path && onDeleteSavedPhoto ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      title="Delete saved gallery image"
                      className="absolute right-2 top-2 h-7 w-7 p-0 opacity-95 group-hover:opacity-100"
                      disabled={disabled}
                      onClick={() => {
                        if (!confirm("Delete this saved gallery image?")) return;
                        void onDeleteSavedPhoto(item.path);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <input
          ref={detailInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            const list = e.target.files;
            if (!list?.length) return;
            const next = Array.from(list).filter(isDetailMedia);
            if (next.length) onDetailFilesAdd(next);
            e.target.value = "";
          }}
        />

        {detailSlots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {detailSlots.map((slot) => (
              <DetailThumb
                key={slot.id}
                slot={slot}
                previewUrl={detailPreviewUrls[slot.id]}
                disabled={disabled}
                onRemove={() => onDetailRemove(slot.id)}
              />
            ))}
          </div>
        ) : null}

        <button
          type="button"
          disabled={disabled}
          onClick={() => detailInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const files = Array.from(e.dataTransfer.files).filter(isDetailMedia);
            if (files.length) onDetailFilesAdd(files);
          }}
          className="w-full min-h-[128px] md:min-h-[144px] rounded-xl border-2 border-dashed border-muted-foreground/25 bg-background/50 flex flex-col items-center justify-center gap-2 px-4 py-6 hover:border-accent/55 hover:bg-muted/25 transition-all"
        >
          <div className="rounded-full bg-muted/80 p-2.5">
            <Plus size={22} className="text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">
            Add photos or videos
          </span>
          <span className="text-xs text-muted-foreground text-center max-w-md">
            Click to browse, or drop files here—multiple images or clips are fine
          </span>
        </button>
      </section>
    </div>
  );
}

function useDetailPreviewUrls(slots: DetailSlot[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    const created: string[] = [];
    for (const s of slots) {
      const u = URL.createObjectURL(s.file);
      next[s.id] = u;
      created.push(u);
    }
    setUrls(next);
    return () => {
      for (const u of created) URL.revokeObjectURL(u);
    };
  }, [slots]);

  return urls;
}

function DetailThumb({
  slot,
  previewUrl,
  disabled,
  onRemove,
}: {
  slot: DetailSlot;
  previewUrl: string | undefined;
  disabled?: boolean;
  onRemove: () => void;
}) {
  const isVideo = slot.file.type.startsWith("video/");
  return (
    <div className="relative aspect-video rounded-xl bg-muted overflow-hidden group border border-muted/80 shadow-sm">
      {previewUrl &&
        (isVideo ? (
          <video
            src={previewUrl}
            className="absolute inset-0 w-full h-full object-cover"
            muted
          />
        ) : (
          <Image
            src={previewUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        ))}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent pt-6 pb-1 px-1.5">
        <p className="text-[10px] truncate text-muted-foreground">
          {slot.file.name}
        </p>
      </div>
      <Button
        type="button"
        size="icon"
        variant="destructive"
        className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Remove"
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}
