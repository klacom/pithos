"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Heart,
    Loader2,
    PackageOpen,
    ShieldCheck,
    ShoppingBag,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    clearCart,
    removeCartItem,
    toggleFavorite,
    type CartListItem,
} from "@/app/shop-actions";

export default function ShoppingCartPage() {
    const router = useRouter();
    const selectAllRef = useRef<HTMLInputElement | null>(null);

    const [items, setItems] = useState<CartListItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [busyItemId, setBusyItemId] = useState<string | null>(null);
    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        setMounted(true);
        let ignore = false;

        async function loadCart() {
            setIsLoading(true);

            try {
                const res = await fetch(`/api/cart/items`, { cache: "no-store" });
                const cartItems: CartListItem[] = await res.json();

                // console.log("Cart Items: ", cartItems)

                if (ignore) return;

                setItems(cartItems);
                setSelectedIds(cartItems.map((item) => item.productId));

                try {
                    const res = await fetch(
                        `/api/cart/suggestions?limit=5&exclude=${cartItems
                            .map((item) => item.productId)
                            .join(",")}`,
                        { cache: "no-store" }
                    );

                    if (!res.ok) {
                        throw new Error("Failed to load suggestions");
                    }

                    const recommendations: any[] = await res.json();

                    if (!ignore) {
                        setSuggestedProducts(recommendations);
                    }
                } catch (error) {
                    console.error(error);

                    if (!ignore) {
                        setSuggestedProducts([]);
                    }
                }

            } catch (error) {
                console.error(error);
                if (!ignore) {
                    toast.error("Unable to load your cart right now.");
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        void loadCart();

        return () => {
            ignore = true;
        };
    }, []);

    const selectedItems = useMemo(
        () => items.filter((item) => selectedIds.includes(item.productId)),
        [items, selectedIds],
    );

    const selectedCount = selectedItems.length;
    const totalItems = items.length;
    const subtotal = selectedItems.reduce((sum, item) => sum + Number(item.price ?? 0), 0);
    const allSelected = totalItems > 0 && selectedCount === totalItems;
    const partiallySelected = selectedCount > 0 && selectedCount < totalItems;

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = partiallySelected;
        }
    }, [partiallySelected]);

    const emitCartUpdated = () => {
        window.dispatchEvent(new CustomEvent("cart-updated"));
        // console.log("EVENT FIRED");
    };

    const toggleItemSelection = (productId: string) => {
        setSelectedIds((current) =>
            current.includes(productId)
                ? current.filter((id) => id !== productId)
                : [...current, productId],
        );
    };

    const toggleSelectAll = () => {
        setSelectedIds(allSelected ? [] : items.map((item) => item.productId));
    };

    const handleRemoveItem = async (productId: string) => {
        setBusyItemId(productId);
        // Optimistic update
        const prevItems = [...items];
        const prevSelectedIds = [...selectedIds];
        setItems((current) => current.filter((item) => item.productId !== productId));
        setSelectedIds((current) => current.filter((id) => id !== productId));

        const result = await removeCartItem(productId);
        setBusyItemId(null);

        if (!result.success) {
            setItems(prevItems); // Revert
            setSelectedIds(prevSelectedIds);
            toast.error(result.error);
            return;
        }

        emitCartUpdated();
        toast.success("Removed from cart.");
    };

    const handleToggleFavorite = async (productId: string) => {
        const item = items.find((i) => i.productId === productId);
        if (!item) return;

        setBusyItemId(productId);

        // Optimistically toggle the favorite status in the UI
        const nextFavoriteStatus = !item.isFavorite;
        setItems((current) =>
            current.map((i) =>
                i.productId === productId ? { ...i, isFavorite: nextFavoriteStatus } : i,
            ),
        );

        const result = await toggleFavorite(productId);
        setBusyItemId(null);

        if (!result.success) {
            // Revert if the server call fails
            setItems((current) =>
                current.map((i) =>
                    i.productId === productId ? { ...i, isFavorite: !nextFavoriteStatus } : i,
                ),
            );
            toast.error(result.error);
            return;
        }

        // Ensure the state matches the actual server action (added or removed)
        const isAdded = result.action === "added";
        setItems((current) =>
            current.map((i) =>
                i.productId === productId ? { ...i, isFavorite: isAdded } : i,
            ),
        );

        emitCartUpdated();
        toast.success(
            isAdded ? "Added to favorites." : "Removed from favorites.",
        );
    };

    const handleClearCart = async () => {
        if (items.length === 0) return;

        setIsClearing(true);
        const result = await clearCart();
        setIsClearing(false);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        setItems([]);
        setSelectedIds([]);
        emitCartUpdated();
        toast.success("Cart cleared.");
    };

    const formatCurrency = (amount: number) => {
        if (!mounted) return "P0.00";
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        }).format(amount);
    };

    return (
        <main className="mx-auto mb-10 flex max-w-screen-2xl flex-col gap-8 px-4 py-6 md:px-8 lg:px-12">
            <div className="flex flex-col gap-3">
                <Button
                    variant="red_ghost"
                    className="w-fit px-0 hover:bg-transparent hover:text-primary"
                    onClick={() => router.back()}
                >
                    <ArrowLeft size={16} />
                    Go Back
                </Button>

                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-bold">Your Cart</h1>
                    <p className="text-foreground/70">
                        {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="space-y-4">
                    <Card className="overflow-hidden">
                        <div className="flex flex-col gap-4 border-b bg-muted/40 p-5 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                                <input
                                    ref={selectAllRef}
                                    type="checkbox"
                                    className="rounded"
                                    checked={allSelected}
                                    onChange={toggleSelectAll}
                                />
                                <label className="cursor-pointer" onClick={toggleSelectAll}>
                                    <p className="font-semibold">
                                        {selectedCount} of {totalItems} selected
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Select individual items or use Select All to update totals dynamically.
                                    </p>
                                </label>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearCart}
                                    disabled={isClearing || items.length === 0}
                                    className="h-9"
                                >
                                    <Trash2 size={16} />
                                    {isClearing ? "Clearing..." : "Clear Cart"}
                                </Button>
                                {selectedCount > 0 ? (
                                    <Button variant="red_default" asChild className="h-9">
                                        <Link
                                            href={`/shopping-cart/checkout?ids=${selectedIds.join(",")}`}
                                        >
                                            Proceed To Checkout
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button variant="disabled" className="h-9">Proceed To Checkout</Button>
                                )}
                            </div>
                        </div>

                        <div className="min-h-[700px] space-y-4 p-5">
                            {isLoading ? (
                                <div className="flex min-h-[600px] w-full flex-col items-center justify-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-5">
                                        <div className="relative h-14 w-14">
                                            <div className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
                                            <div className="h-14 w-14 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                                        </div>
                                        <p className="animate-pulse font-medium tracking-wide">Loading your cart items...</p>
                                    </div>
                                </div>
                            ) : items.length === 0 ? (
                                <div className="flex min-h-[600px] w-full flex-col items-center justify-center p-8 text-center">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 scale-150 blur-2xl bg-accent/5 rounded-full" />
                                        <ShoppingBag className="relative text-accent/20" size={100} />
                                    </div>
                                    <h2 className="text-3xl font-bold tracking-tight">Your cart is empty</h2>
                                    <p className="mt-3 max-w-[340px] text-lg text-muted-foreground leading-relaxed">
                                        Explore our collection of premium digital assets and find something amazing today.
                                    </p>
                                    <Button className="mt-10 h-14 px-10 rounded-full text-lg shadow-lg shadow-accent/10 hover:shadow-accent/20 transition-all" asChild>
                                        <Link href="/product-listing">Start Exploring</Link>
                                    </Button>
                                </div>
                            ) : (
                                items.map((item) => {
                                    const selected = selectedIds.includes(item.productId);
                                    const isBusy = busyItemId === item.productId;

                                    return (
                                        <Card
                                            key={item.productId}
                                            className={`rounded-3xl border transition ${selected ? "border-accent/40 shadow-md" : "border-border"
                                                }`}
                                        >
                                            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded"
                                                        checked={selected}
                                                        onChange={() => toggleItemSelection(item.productId)}
                                                    />

                                                    <Link
                                                        href={`/product-detail/${item.productId}`}
                                                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border"
                                                    >
                                                        <Image
                                                            fill
                                                            src={item.imageSrc}
                                                            alt={item.title}
                                                            className="object-cover"
                                                            sizes="96px"
                                                        />
                                                    </Link>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                                        <div className="min-w-0">
                                                            <Link
                                                                href={`/product-detail/${item.productId}`}
                                                                className="line-clamp-2 text-lg font-semibold hover:text-accent"
                                                            >
                                                                {item.title}
                                                            </Link>
                                                            <p className="mt-1 text-sm text-foreground/80">
                                                                by {item.sellerName}
                                                            </p>
                                                            <p className="mt-2 line-clamp-2 text-sm text-foreground/70">
                                                                {item.subtitle || "Ready-to-use digital product package."}
                                                            </p>
                                                        </div>

                                                        <div className="shrink-0 text-left md:text-right">
                                                            <p className="text-sm text-foreground/70">Price</p>
                                                            <p className="text-xl font-bold">{item.priceLabel}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                                                        <span className="rounded-full bg-muted px-3 py-1 text-foreground/70">
                                                            Added {new Date(item.addedAt).toLocaleDateString("en-PH")}
                                                        </span>
                                                        <span className="rounded-full bg-muted px-3 py-1 text-foreground/70 capitalize">
                                                            {item.productStatus}
                                                        </span>
                                                        {selected ? (
                                                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600">
                                                                Included in total
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 flex-row gap-2 md:flex-col">
                                                    <Button
                                                        variant={"red_ghost"}
                                                        onClick={() => handleToggleFavorite(item.productId)}
                                                        disabled={busyItemId === item.productId}
                                                    >
                                                        <Heart
                                                            size={16}
                                                            className={item.isFavorite ? "fill-current" : ""}
                                                        />
                                                        {/* {item.isFavorite ? "Favorited" : "Favorite"} */}
                                                    </Button>
                                                    <Button
                                                        variant="red_ghost"
                                                        onClick={() => handleRemoveItem(item.productId)}
                                                        disabled={busyItemId === item.productId}
                                                        className="text-destructive"
                                                    >
                                                        {busyItemId === item.productId ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </div>

                <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
                    <Card className="rounded-3xl p-6">
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-foreground/70">Selected subtotal</p>
                                <h2 className="mt-2 text-3xl font-bold">
                                    {formatCurrency(subtotal)}
                                </h2>
                                <p className="mt-2 text-sm text-foreground/70">
                                    {selectedCount} selected item{selectedCount === 1 ? "" : "s"} out of{" "}
                                    {totalItems}
                                </p>
                            </div>

                            <div className="space-y-3 rounded-2xl bg-muted/40 p-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 text-accent" size={16} />
                                    <p className="text-foreground/70">
                                        Checkbox changes update the total instantly.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <PackageOpen className="mt-0.5 text-accent" size={16} />
                                    <p className="text-foreground/70">
                                        Prices stay in Philippine Peso and tax is not applied yet.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="mt-0.5 text-accent" size={16} />
                                    <p className="text-foreground/70">
                                        Removing or clearing cart only deletes cart rows, not the products themselves.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 border-t pt-4 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-foreground/70">Items selected</span>
                                    <span className="font-medium">{selectedCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-foreground/70">Tax</span>
                                    <span className="font-medium">Not applied</span>
                                </div>
                                <div className="flex items-center justify-between text-base font-semibold">
                                    <span>Total</span>
                                    <span>
                                        {formatCurrency(subtotal)}
                                    </span>
                                </div>
                            </div>

                            {selectedCount > 0 ? (
                                <Button variant="red_default" className="h-12 w-full" asChild>
                                    <Link href={`/shopping-cart/checkout?ids=${selectedIds.join(',')}`}>Proceed To Checkout</Link>
                                </Button>
                            ) : (
                                <Button variant="disabled" className="h-12 w-full">
                                    Proceed To Checkout
                                </Button>
                            )}
                        </div>
                    </Card>
                </aside>
            </div>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold">You might like...</h2>
                {suggestedProducts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                        {suggestedProducts.map((product) => (
                            <ProductCard key={product.id} {...product} />
                        ))}
                    </div>
                ) : (
                    <Card className="p-6 text-foreground/70">
                        Recommendations will appear here once more products are available.
                    </Card>
                )}
            </section>
        </main>
    );
}
