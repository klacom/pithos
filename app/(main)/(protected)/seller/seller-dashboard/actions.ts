"use server";

import { getSellerOrders, type SellerOrderRow } from "../orders/actions";
import {
  listSellerProductRows,
  productRowToAssetItem,
} from "@/lib/seller/products";

export type DashboardRecentAsset = {
  productId: string;
  title: string;
  status: string;
  updatedLabel: string;
};

export type DashboardRecentOrder = {
  transactionId: string;
  productName: string;
  status: string;
  amountPhp: number;
  createdAt: string;
};

export type SellerDashboardSnapshot = {
  assetsCount: number;
  ordersCount: number;
  /** Sum of listing prices on completed-like transactions only */
  recognizedRevenuePhp: number;
  pendingRevenuePhp: number;
  recentAssets: DashboardRecentAsset[];
  recentOrders: DashboardRecentOrder[];
  activeAsset: DashboardRecentAsset | null;
  /** Six entries, oldest → newest month label */
  revenueChartLabels: string[];
  /** Completed (and paid-like) revenue per month aligned with labels */
  revenueChartValuesPhp: number[];
  growthPercentVsPriorMonth: number | null;
  error?: string | null;
};

function normStatus(s: string) {
  return s.trim().toLowerCase();
}

function isRecognizedSale(status: string) {
  const n = normStatus(status);
  return (
    n === "completed" ||
    n === "paid" ||
    n === "succeeded" ||
    n === "captured"
  );
}

function excludedFromActive(status: string) {
  const n = normStatus(status);
  return n === "cancelled" || n === "canceled" || n === "refunded";
}

function transactionAmountPhp(row: SellerOrderRow): number {
  return row.product?.price ?? 0;
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthBucketKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function formatMonthShortLabel(monthKeyStr: string): string {
  const [y, m] = monthKeyStr.split("-").map(Number);
  if (!y || !m) return monthKeyStr;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function relativePastLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const ms = Date.now() - d.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days < 0) return "just now";
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 14) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks} wk ago`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months} mo ago` : "over a year ago";
}

export async function getSellerDashboardData(): Promise<SellerDashboardSnapshot> {
  const [productsRes, ordersRes] = await Promise.all([
    listSellerProductRows(),
    getSellerOrders(),
  ]);

  const errs: string[] = [];
  if (productsRes.error) errs.push(productsRes.error);
  if (!ordersRes.success && ordersRes.error) errs.push(ordersRes.error);

  const productRows = productsRes.rows ?? [];
  const orders = ordersRes.success ? ordersRes.data : [];

  const activeOrders = orders.filter((o) => !excludedFromActive(o.status));

  let recognizedRevenuePhp = 0;
  let pendingRevenuePhp = 0;
  for (const o of activeOrders) {
    const amt = transactionAmountPhp(o);
    if (isRecognizedSale(o.status)) recognizedRevenuePhp += amt;
    else pendingRevenuePhp += amt;
  }

  const recentAssets: DashboardRecentAsset[] = productRows
    .slice(0, 5)
    .map((row) => {
      const item = productRowToAssetItem(row);
      return {
        productId: row.product_id,
        title: row.product_name,
        status: item.status,
        updatedLabel: relativePastLabel(row.created_at),
      };
    });

  const activeAsset =
    recentAssets.find((a) => a.status === "Draft") ?? recentAssets[0] ?? null;

  const recentOrders: DashboardRecentOrder[] = orders
    .slice(0, 5)
    .map((o) => ({
      transactionId: o.transaction_id,
      productName:
        o.product?.product_name?.trim() ||
        `Product ${shortId(o.product_id)}`,
      status: o.status,
      amountPhp: transactionAmountPhp(o),
      createdAt: o.created_at,
    }));

  const keys = monthBucketKeys();
  const byMonth = new Map<string, number>();
  for (const k of keys) byMonth.set(k, 0);

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const priorMonthKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

  for (const o of activeOrders) {
    if (!isRecognizedSale(o.status)) continue;
    const mk = monthKey(o.created_at);
    if (mk && byMonth.has(mk)) {
      byMonth.set(mk, (byMonth.get(mk) ?? 0) + transactionAmountPhp(o));
    }
  }

  const revenueChartValuesPhp = keys.map((k) => byMonth.get(k) ?? 0);
  const revenueChartLabels = keys.map(formatMonthShortLabel);

  const thisM = byMonth.get(thisMonthKey) ?? 0;
  const priorM = byMonth.get(priorMonthKey) ?? 0;
  let growthPercentVsPriorMonth: number | null = null;
  if (priorM > 0) {
    growthPercentVsPriorMonth = ((thisM - priorM) / priorM) * 100;
  } else if (thisM > 0 && priorM === 0) {
    growthPercentVsPriorMonth = 100;
  }

  return {
    assetsCount: productRows.length,
    ordersCount: orders.length,
    recognizedRevenuePhp,
    pendingRevenuePhp,
    recentAssets,
    recentOrders,
    activeAsset,
    revenueChartLabels,
    revenueChartValuesPhp,
    growthPercentVsPriorMonth,
    error: errs.length > 0 ? errs.join(" · ") : null,
  };
}

function shortId(id: string) {
  if (!id) return "";
  return id.length <= 12 ? id : `${id.slice(0, 6)}…${id.slice(-4)}`;
}
