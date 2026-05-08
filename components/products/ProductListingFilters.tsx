"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ListingCategory = { id: string; name: string };

export type ProductListingFilterState = {
  q: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  onSale: boolean;
  minRating: string;
  sort: "relevance" | "newest" | "price_asc" | "price_desc" | "rating_desc";
};

function nextParams(
  current: URLSearchParams,
  updates: Array<[key: string, value: string | null]>,
) {
  const p = new URLSearchParams(current);
  for (const [k, v] of updates) {
    if (v == null || v === "") p.delete(k);
    else p.set(k, v);
  }
  return p;
}

export default function ProductListingFilters(props: {
  categories: ListingCategory[];
  value: ProductListingFilterState;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [minPrice, setMinPrice] = useState(props.value.minPrice);
  const [maxPrice, setMaxPrice] = useState(props.value.maxPrice);
  const [minRating, setMinRating] = useState(props.value.minRating);

  useEffect(() => setMinPrice(props.value.minPrice), [props.value.minPrice]);
  useEffect(() => setMaxPrice(props.value.maxPrice), [props.value.maxPrice]);
  useEffect(() => setMinRating(props.value.minRating), [props.value.minRating]);

  const push = useCallback(
    (updates: Array<[string, string | null]>) => {
      const p = nextParams(new URLSearchParams(sp?.toString()), updates);
      const qs = p.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, sp],
  );

  const categoryOptions = useMemo(() => {
    const cleaned = props.categories.filter(
      (c) => String(c.id) !== "" && String(c.name).trim().toLowerCase() !== "all categories",
    );
    return [{ id: "", name: "All Categories" }, ...cleaned];
  }, [props.categories]);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3 items-end">
        <div className="col-span-2 md:col-span-2 flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={props.value.category}
            onChange={(e) => push([["category", e.currentTarget.value]])}
          >
            {categoryOptions.map((c) => (
              <option key={c.id || "all"} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Min price</Label>
          <Input
            inputMode="decimal"
            placeholder="0"
            className="h-10"
            value={minPrice}
            onChange={(e) => setMinPrice(e.currentTarget.value)}
            onBlur={() => push([["minPrice", minPrice.trim()]])}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Max price</Label>
          <Input
            inputMode="decimal"
            placeholder="5000"
            className="h-10"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.currentTarget.value)}
            onBlur={() => push([["maxPrice", maxPrice.trim()]])}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Min rating</Label>
          <Input
            inputMode="decimal"
            placeholder="0–5"
            className="h-10"
            value={minRating}
            onChange={(e) => setMinRating(e.currentTarget.value)}
            onBlur={() => push([["minRating", minRating.trim()]])}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Sort</Label>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={props.value.sort}
            onChange={(e) => push([["sort", e.currentTarget.value]])}
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="rating_desc">Rating</option>
          </select>
        </div>

        <div className="flex items-center h-10">
          <Button
            type="button"
            className="w-full h-10"
            onClick={() => {
              push([
                ["q", props.value.q],
                ["minPrice", minPrice.trim()],
                ["maxPrice", maxPrice.trim()],
                ["minRating", minRating.trim()],
              ]);
            }}
          >
            Set Filter
          </Button>
        </div>

        <div className="col-span-2 md:col-span-7 flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="onSale"
              checked={props.value.onSale}
              onCheckedChange={(v) => push([["onSale", v ? "1" : null]])}
            />
            <Label htmlFor="onSale" className="text-sm">
              On sale
            </Label>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => router.push("/product-listing")}
          >
            Clear filters
          </Button>
        </div>
      </div>
    </div>
  );
}

