"use client";

import { Button } from "@/components/ui/button";
import {
  Eye,
  FileText,
  Download,
  ArrowLeft,
  ArrowRight,
  ArrowLeftCircle,
  ArrowRightCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  formatPhpPrice,
  type AssetItem,
} from "@/components/seller/seller-assets";

type Props = {
  asset: AssetItem;
  media: {
    coverUrl: string | null;
    detailUrls: string[];
    packageFileNames: string[];
    packageDownloadUrl: string | null;
    packageDownloadName: string | null;
  };
};

export default function ViewAssetDetail({ asset, media }: Props) {
  const gallery = useMemo(() => {
    const out: string[] = [];
    if (media.coverUrl) out.push(media.coverUrl);
    for (const u of media.detailUrls) {
      if (!out.includes(u)) out.push(u);
    }
    return out;
  }, [media.coverUrl, media.detailUrls]);

  const [activeIndex, setActiveIndex] = useState(0);
  const active = gallery[activeIndex] ?? null;

  const goPrev = () => {
    if (gallery.length < 2) return;
    setActiveIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  const goNext = () => {
    if (gallery.length < 2) return;
    setActiveIndex((prev) => (prev + 1) % gallery.length);
  };

  return (
    <main className="w-full px-4 py-6 md:px-8 lg:px-10 xl:px-12">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8">
      <Button asChild variant="ghost" className="w-fit -ml-2">
        <Link
          href="/seller/assets"
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Assets
        </Link>
      </Button>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{asset.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{asset.category}</Badge>
              <Badge variant={asset.status === "Published" ? "default" : "outline"}>
                {asset.status}
              </Badge>
              <span className="text-sm text-muted-foreground">Listed {asset.date}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[5fr_2fr]">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="relative h-[320px] overflow-hidden rounded-xl border bg-muted sm:h-[420px] lg:h-[520px]">
          {active ? (
            <>
              <Image
                src={active}
                alt={`${asset.title} background`}
                fill
                className="object-cover blur-md scale-110 opacity-50"
                sizes="(max-width: 1280px) 100vw, 960px"
                priority
              />
              <div className="absolute inset-0 bg-black/30" />
              <Image
                src={active}
                alt={`${asset.title} preview`}
                fill
                className="object-contain p-3 sm:p-4"
                sizes="(max-width: 1280px) 100vw, 960px"
                priority
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground">No preview uploaded yet</span>
            </div>
          )}

          {gallery.length > 1 ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 hover:bg-background"
                aria-label="Show previous image"
              >
                <ArrowLeft size={18} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 hover:bg-background"
                aria-label="Show next image"
              >
                <ArrowRight size={18} />
              </Button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs text-white">
                {activeIndex + 1} / {gallery.length}
              </div>
            </>
          ) : null}
          </div>

        {gallery.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {gallery.slice(0, 12).map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setActiveIndex(gallery.indexOf(url))}
                className={`relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-md border transition ${
                  active === url ? "border-accent ring-1 ring-accent" : "border-border"
                }`}
                aria-label="Select preview image"
              >
                <Image
                  src={url}
                  alt="Thumbnail"
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </button>
            ))}
          </div>
        ) : null}
          {gallery.length > 1 ? (
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={goPrev}
                className="h-8 gap-1 text-muted-foreground"
              >
                <ArrowLeftCircle size={16} />
                Prev
              </Button>
              {gallery.slice(0, 8).map((url, i) => (
                <button
                  key={`${url}-dot`}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    activeIndex === i ? "bg-accent" : "bg-muted-foreground/30"
                  }`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={goNext}
                className="h-8 gap-1 text-muted-foreground"
              >
                Next
                <ArrowRightCircle size={16} />
              </Button>
            </div>
          ) : null}
        </section>

        <aside className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="text-3xl font-bold">{formatPhpPrice(asset.price)}</span>
            </div>

            <div className="mt-4 flex gap-2">
              {media.packageDownloadUrl ? (
                <Button asChild className="w-full flex gap-2">
                  <a
                    href={media.packageDownloadUrl}
                    download={media.packageDownloadName ?? undefined}
                  >
                    <Download size={16} />
                    Download
                  </a>
                </Button>
              ) : (
                <Button className="w-full flex gap-2" type="button" disabled>
                  <Download size={16} />
                  No package yet
                </Button>
              )}
            </div>

            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <Eye size={14} /> {asset.views} views
              </span>
              <span className="flex items-center gap-2">
                <FileText size={14} /> {asset.downloads} downloads
              </span>
            </div>

            {media.packageFileNames.length > 0 ? (
              <div className="mt-3 text-xs text-muted-foreground break-all">
                File:{" "}
                <span className="text-foreground/90">
                  {media.packageFileNames[0]}
                </span>
              </div>
            ) : null}
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold">Tags</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Used for search and browsing.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(asset.tags ?? []).length > 0 ? (
                (asset.tags ?? []).map((t) => (
                  <Badge key={t} variant="secondary" className="font-medium">
                    {t}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No tags added.</span>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold">Package</h2>
            <p className="text-xs text-muted-foreground mt-1">
              What buyers will download.
            </p>
            <div className="mt-3 space-y-2 text-sm">
              {media.packageFileNames.length > 0 ? (
                <ul className="list-disc pl-5 text-muted-foreground">
                  {media.packageFileNames.slice(0, 5).map((n) => (
                    <li key={n} className="break-all">
                      {n}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No package uploaded.
                </span>
              )}
            </div>
          </Card>
        </aside>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-lg">About this asset</h2>
        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
          {asset.description?.trim()
            ? asset.description
            : "No description provided yet. Add details like contents, specs, and usage tips."}
        </p>
      </Card>
      </div>
    </main>
  );
}
