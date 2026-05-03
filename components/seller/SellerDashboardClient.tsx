"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import LineChart from "@/components/technical-components/LineChart";
import CardStat from "@/components/technical-components/CardStat";
import {
  Eye,
  ShoppingBag,
  CreditCard,
  BarChart3,
  ArrowUpRight,
  PackagePlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSellerDashboardData,
  type SellerDashboardSnapshot,
} from "@/app/(main)/(protected)/seller/seller-dashboard/actions";

function formatPhp(n: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatInt(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function formatOrderDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SellerDashboardClient() {
  const iconSize = 32;
  const [data, setData] = useState<SellerDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getSellerDashboardData();
        if (cancelled) return;
        setData(snap);
        if (snap.error) toast.error(snap.error);
      } catch {
        if (!cancelled) toast.error("Could not load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const snap = data;
  const recognized = snap?.recognizedRevenuePhp ?? 0;
  const pending = snap?.pendingRevenuePhp ?? 0;
  const growth = snap?.growthPercentVsPriorMonth;
  const growthLabel =
    growth == null ? "—" : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`;

  const draftTarget = snap?.recentAssets?.find((a) => a.status === "Draft");

  return (
    <div className="flex flex-col p-4 bg-background w-full gap-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor your assets, sales, and performance
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/seller/assets">
              <PackagePlus className="h-4 w-4 mr-2" aria-hidden />
              New asset
            </Link>
          </Button>
          {draftTarget ? (
            <Button asChild>
              <Link href={`/seller/view-assets?id=${draftTarget.productId}`}>
                Open draft
              </Link>
            </Button>
          ) : (
            <Button type="button" disabled>
              Open draft
            </Button>
          )}
        </div>
      </div>

      <hr />

      {loading && (
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      )}

      {/* STATS */}
      <div className="flex gap-4 w-full flex-col md:flex-row *:md:w-full">
        <CardStat
          header={formatInt(snap?.assetsCount ?? 0)}
          subHeader="Assets listed"
          icon={<BarChart3 size={iconSize} />}
        />
        <CardStat
          header={formatInt(snap?.ordersCount ?? 0)}
          subHeader="All-time orders"
          icon={<ShoppingBag size={iconSize} />}
        />
        <CardStat
          header={formatPhp(recognized)}
          subHeader="Recognized revenue"
          icon={<CreditCard size={iconSize} />}
        />
      </div>

      {/* ACTIVITY PANELS */}
      <div className="flex gap-4 w-full flex-col lg:flex-row min-h-[260px]">
        <div className="w-full bg-primary-foreground border border-muted rounded-xl p-4 flex flex-col min-h-[200px]">
          <h2 className="font-bold text-xl">Recent assets</h2>
          <hr className="my-2" />

          <div className="flex flex-col gap-2 text-sm flex-1 overflow-y-auto">
            {snap?.recentAssets && snap.recentAssets.length > 0 ? (
              snap.recentAssets.map((a) => (
                <div
                  key={a.productId}
                  className="flex justify-between items-center gap-2"
                >
                  <div className="flex flex-col min-w-0">
                    <p className="font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.status} · {a.updatedLabel}
                    </p>
                  </div>
                  <Button size="icon" variant="red_default" asChild>
                    <Link
                      href={`/seller/view-assets?id=${a.productId}`}
                      aria-label={`View ${a.title}`}
                    >
                      <Eye size={18} />
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm py-4">
                No assets yet.{" "}
                <Link href="/seller/assets" className="text-accent underline">
                  Create one
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        <div className="w-full bg-primary-foreground border border-muted rounded-xl p-4 flex flex-col min-h-[200px]">
          <h2 className="font-bold text-xl">Recent orders</h2>
          <hr className="my-2" />

          <div className="flex flex-col gap-2 text-sm flex-1 overflow-y-auto">
            {snap?.recentOrders && snap.recentOrders.length > 0 ? (
              snap.recentOrders.map((o) => (
                <div
                  key={o.transactionId}
                  className="flex justify-between items-center gap-2"
                >
                  <div className="flex flex-col min-w-0">
                    <p className="font-medium truncate">{o.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPhp(o.amountPhp)} · {o.status} ·{" "}
                      {formatOrderDate(o.createdAt)}
                    </p>
                  </div>
                  <Button size="icon" variant="red_default" asChild>
                    <Link href="/seller/orders" aria-label="View orders">
                      <Eye size={18} />
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm py-4">
                No orders yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* LOWER SECTION */}
      <div className="flex gap-4 w-full flex-col lg:flex-row min-h-[320px] lg:overflow-hidden">
        <div className="flex-1 min-w-0 bg-primary-foreground border border-muted rounded-xl p-4 flex flex-col gap-4 lg:h-[320px]">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h2 className="font-bold text-xl">Recognized revenue by month</h2>
            <Button size="sm" variant="outline" type="button" disabled title="Coming soon">
              Export
            </Button>
          </div>

          <div className="h-[240px] min-h-[220px] w-full lg:flex-1">
            {!loading && snap ? (
              <LineChart
                labels={snap.revenueChartLabels}
                values={snap.revenueChartValuesPhp}
                datasetLabel="Recognized PHP"
                chartTitle="Last six months — completed revenue"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground border border-dashed border-muted rounded-md">
                Loading chart…
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4">
          <div className="bg-primary-foreground border border-muted rounded-xl p-4">
            <h2 className="font-bold text-lg">Spotlight listing</h2>
            <p className="text-sm mt-2 font-medium line-clamp-2">
              {snap?.activeAsset?.title ?? "No listings yet"}
            </p>

            <div className="mt-4 text-sm flex justify-between gap-4">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-right">
                {snap?.activeAsset?.status ?? "—"}
              </span>
            </div>

            <div className="text-sm flex justify-between gap-4">
              <span className="text-muted-foreground">Listed</span>
              <span className="font-medium text-right">
                {snap?.activeAsset?.updatedLabel ?? "—"}
              </span>
            </div>

            {snap?.activeAsset && (
              <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                <Link
                  href={`/seller/view-assets?id=${snap.activeAsset.productId}`}
                >
                  View listing
                </Link>
              </Button>
            )}
          </div>

          <div className="bg-primary-foreground border border-muted rounded-xl p-4">
            <h2 className="font-bold text-lg">Revenue breakdown</h2>

            <div className="mt-3 text-sm space-y-2">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Pending / in progress</span>
                <span className="font-medium tabular-nums">{formatPhp(pending)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Recognized (completed-like)</span>
                <span className="font-medium tabular-nums">{formatPhp(recognized)}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center text-sm border-t border-muted pt-3 gap-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight size={16} aria-hidden />
                vs prior month (recognized)
              </div>
              <span className="font-medium tabular-nums whitespace-nowrap">
                {growthLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
