"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { toast } from "sonner";
import {
  getSellerOrders,
  type SellerOrderBuyer,
  type SellerOrderRow,
} from "@/app/(main)/(protected)/seller/orders/actions";

const PAGE_SIZE = 8;

export default function SellerOrdersPageClient() {
  const [rows, setRows] = useState<SellerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState<"date" | "amount" | "status">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [buyerModal, setBuyerModal] = useState<{
    order: SellerOrderRow;
    buyer: SellerOrderBuyer | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getSellerOrders();
        if (cancelled) return;
        if (res.success) {
          setRows(res.data ?? []);
        } else {
          toast.error(res.error || "Failed to load orders");
          setRows([]);
        }
      } catch {
        if (!cancelled) toast.error("Failed to load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;

    if (statusFilter !== "All") {
      list = list.filter(
        (r) => r.status.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    if (q) {
      list = list.filter((r) => {
        const buyerName = r.buyer?.user_fullname?.toLowerCase() ?? "";
        const buyerEmail = r.buyer?.user_email?.toLowerCase() ?? "";
        const productName = r.product?.product_name?.toLowerCase() ?? "";
        return (
          r.transaction_id.toLowerCase().includes(q) ||
          r.buyer_id.toLowerCase().includes(q) ||
          r.product_id.toLowerCase().includes(q) ||
          buyerName.includes(q) ||
          buyerEmail.includes(q) ||
          productName.includes(q)
        );
      });
    }

    const dir = sortDir === "asc" ? 1 : -1;
    const sorted = [...list].sort((a, b) => {
      if (sortKey === "date") {
        const ta = new Date(a.created_at).getTime();
        const tb = new Date(b.created_at).getTime();
        return (ta - tb) * dir;
      }
      if (sortKey === "amount") {
        const pa = a.product?.price ?? 0;
        const pb = b.product?.price ?? 0;
        return (pa - pb) * dir;
      }
      return a.status.localeCompare(b.status) * dir;
    });

    return sorted;
  }, [rows, search, statusFilter, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const sliceStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filteredSorted.slice(sliceStart, sliceStart + PAGE_SIZE);

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(n);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "refunded":
        return "text-blue-600";
      case "cancelled":
      case "canceled":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const showStart = filteredSorted.length === 0 ? 0 : sliceStart + 1;
  const showEnd = sliceStart + pageRows.length;

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="font-bold text-3xl">Your Orders</h1>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
          <div className="flex items-center h-10">
            <Input
              placeholder="Search buyer, product, IDs…"
              className="rounded-r-none h-full w-56 min-w-[12rem]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="red_default" className="rounded-l-none h-full px-3" type="button">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <select
            className="border border-muted outline-none focus:border-foreground h-10 px-2 rounded-md bg-primary-foreground"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
            aria-label="Sort by"
          >
            <option value="date">Sort: Date</option>
            <option value="amount">Sort: Amount</option>
            <option value="status">Sort: Status</option>
          </select>
          <select
            className="border border-muted outline-none focus:border-foreground h-10 px-2 rounded-md bg-primary-foreground"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as typeof sortDir)}
            aria-label="Sort direction"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
          <select
            className="border border-muted outline-none focus:border-foreground h-10 px-2 rounded-md bg-primary-foreground"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            {["All", "Pending", "Completed", "Refunded", "Cancelled"].map(
              (s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All statuses" : s}
                </option>
              ),
            )}
          </select>
        </div>
      </div>
      <hr />

      <div className="flex flex-col gap-4 h-full">
        <div className="w-full p-4 bg-primary-foreground border border-muted rounded-lg flex-1 flex flex-col justify-between">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-muted-foreground">Loading orders…</p>
            </div>
          ) : filteredSorted.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-12 gap-2">
              <p className="text-muted-foreground">
                {rows.length === 0
                  ? "No orders yet for your products."
                  : "No orders match your search or filters."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table
                  className="*:*:*:border *:*:*:border-muted *:*:*:p-4 w-full bg-primary-foreground"
                  border={1}
                >
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Buyer</th>
                      <th>Product</th>
                      <th>Created</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => {
                      const buyerLabel =
                        r.buyer?.user_fullname?.trim() ||
                        r.buyer?.user_email ||
                        shortId(r.buyer_id);
                      return (
                        <tr key={r.transaction_id}>
                          <td className="font-mono text-xs max-w-[9rem] break-all">
                            {r.transaction_id}
                          </td>
                          <td className="text-sm">{buyerLabel}</td>
                          <td className="text-sm">
                            {r.product?.product_name ?? "—"}
                          </td>
                          <td>{formatDate(r.created_at)}</td>
                          <td>{formatPrice(r.product?.price ?? 0)}</td>
                          <td className={getStatusColor(r.status)}>
                            {r.status || "—"}
                          </td>
                          <td>
                            <Button
                              variant="link"
                              className="text-red-500 hover:text-red-600 px-0"
                              onClick={() =>
                                setBuyerModal({ order: r, buyer: r.buyer })
                              }
                            >
                              Buyer details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-2 pt-4 mt-4 border-t border-muted">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">{showStart}</span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground">{showEnd}</span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {filteredSorted.length}
                  </span>{" "}
                  results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous page</span>
                  </Button>
                  <span className="text-sm text-muted-foreground px-1">
                    {safePage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    disabled={safePage >= totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next page</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-muted-foreground self-center mt-4">
        <i>
          Pithos has a commission percentage of 30/70, wheareas the 30% of the
          assets revenue goes to Pithos, and the rest (70%) goes to the asset
          sellers.
        </i>{" "}
        <Link href="#" className="text-medium text-accent">
          Learn More
        </Link>
      </p>

      {buyerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="presentation"
          onClick={() => setBuyerModal(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-muted bg-background p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="buyer-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4">
              <h2 id="buyer-detail-title" className="font-semibold text-lg">
                Buyer details
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setBuyerModal(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Order{" "}
              <span className="font-mono text-foreground">
                {buyerModal.order.transaction_id}
              </span>
            </p>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">
                  {buyerModal.buyer?.user_fullname?.trim() || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-mono text-xs break-all">
                  {buyerModal.buyer?.user_email || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">User ID</dt>
                <dd className="font-mono text-xs break-all">
                  {buyerModal.buyer?.id ?? buyerModal.order.buyer_id}
                </dd>
              </div>
              {buyerModal.buyer?.user_role != null && (
                <div>
                  <dt className="text-muted-foreground">Role</dt>
                  <dd>{buyerModal.buyer.user_role}</dd>
                </div>
              )}
              {buyerModal.buyer?.created_at != null &&
                buyerModal.buyer.created_at !== "" && (
                  <div>
                    <dt className="text-muted-foreground">Joined</dt>
                    <dd>{formatDate(buyerModal.buyer.created_at)}</dd>
                  </div>
                )}
            </dl>
            {!buyerModal.buyer && (
              <p className="text-xs text-muted-foreground mt-2">
                Profile not found in the users directory; showing buyer ID from
                the order only.
              </p>
            )}
            <Button
              type="button"
              className="mt-6 w-full"
              variant="outline"
              onClick={() => setBuyerModal(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function shortId(id: string) {
  if (!id) return "—";
  return id.length <= 12 ? id : `${id.slice(0, 6)}…${id.slice(-4)}`;
}
