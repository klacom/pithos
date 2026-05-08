"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ProductCard } from "../products/ProductCard";
import { ProductCardSkeleton } from "../banner-announcements/BannerSkeletons";
import { createClient } from "@/lib/supabase/client";
import { mapProductRows, MappedProduct } from "@/lib/products";
import { useInView } from "framer-motion";

export function InfiniteProductList() {
    const supabase = createClient();
    const [products, setProducts] = useState<MappedProduct[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const ref = useRef(null);
    const inView = useInView(ref);

    const PAGE_SIZE = 10;

    const fetchMoreProducts = useCallback(async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);

        try {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("product_status", "published")
                .order("created_at", { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (error) throw error;

            if (data && data.length > 0) {
                const mapped = await mapProductRows(supabase, data);
                setProducts((prev) => [...prev, ...mapped]);
                setPage((prev) => prev + 1);
                if (data.length < PAGE_SIZE) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Error fetching infinite products:", err);
        } finally {
            setIsLoading(false);
        }
    }, [page, isLoading, hasMore, supabase]);

    useEffect(() => {
        if (inView && hasMore && !isLoading) {
            fetchMoreProducts();
        }
    }, [inView, hasMore, isLoading, fetchMoreProducts]);

    return (
        <section className="w-full flex flex-col gap-6 py-12 border-t border-muted">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight">Discover More</h2>
                <p className="text-muted-foreground text-sm">Products you might be interested in</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((product, idx) => (
                    <ProductCard key={`${product.id}-${idx}`} {...product} />
                ))}
                
                {(isLoading || hasMore) && (
                    <>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={`skeleton-${i}`} ref={i === 0 ? ref : null}>
                                <ProductCardSkeleton />
                            </div>
                        ))}
                    </>
                )}
            </div>

            {!hasMore && products.length > 0 && (
                <p className="text-center text-muted-foreground py-8">
                    You've reached the end of our current collection. Check back later for more!
                </p>
            )}
        </section>
    );
}
