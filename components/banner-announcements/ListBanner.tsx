"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ProductCard } from "../products/ProductCard"
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { mapProductRows, MappedProduct } from "@/lib/products";
import { ListBannerSkeleton } from "./BannerSkeletons";

type ListType = "views" | "downloads" | "ratings" | "favorites" | "featured"

type ListBannerContent = {
    title: string
    subtitle: string
    listType: ListType
    selectedProductIds: string[]
}

type Props = {
    content: ListBannerContent
}

export function ListBanner({ content }: Props) {
    const supabase = createClient();
    const [products, setProducts] = useState<MappedProduct[]>([]);
    const [loading, setLoading] = useState(true);

    const seeMoreLink = useMemo(() => {
        if (content.listType === "featured") return null;
        const baseUrl = "/product-listing"
        const params = new URLSearchParams()

        switch (content.listType) {
            case "views":
                // No direct "views" sort in product-listing, use newest as default for "Popular"
                params.set("sort", "newest")
                break
            case "ratings":
                params.set("sort", "rating_desc")
                break
            case "favorites":
                // Use relevance or newest for favorites list type
                params.set("sort", "relevance")
                break
            default:
                break
        }

        const qs = params.toString()
        return qs ? `${baseUrl}?${qs}` : baseUrl
    }, [content.listType])

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            let fetchedProducts: MappedProduct[] = [];

            if (content.listType === "featured") {
                if (content.selectedProductIds?.length > 0) {
                    const { data } = await supabase
                        .from("products")
                        .select("*")
                        .in("product_id", content.selectedProductIds);

                    if (data) {
                        const mapped = await mapProductRows(supabase, data);
                        // Maintain order
                        fetchedProducts = content.selectedProductIds
                            .map(id => mapped.find(p => p.id === id))
                            .filter(Boolean) as MappedProduct[];
                    }
                }
            } else {
                let query = supabase
                    .from("products")
                    .select("*")
                    .eq("product_status", "published")
                    .limit(5);

                if (content.listType === "views") {
                    query = query.order("created_at", { ascending: false });
                } else if (content.listType === "ratings") {
                    query = query.order("created_at", { ascending: false });
                } else if (content.listType === "favorites") {
                    query = query.order("created_at", { ascending: false });
                }

                const { data } = await query;
                if (data) {
                    fetchedProducts = await mapProductRows(supabase, data);
                }
            }

            setProducts(fetchedProducts);
        } catch (err) {
            console.error("Error fetching list banner products:", err);
        } finally {
            setLoading(false);
        }
    }, [content.listType, content.selectedProductIds, supabase]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    if (loading) {
        return <ListBannerSkeleton />;
    }

    if (products.length === 0) return null;

    return (
        <section className="w-full flex flex-col gap-6 py-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {content.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {content.subtitle}
                    </p>
                </div>

                {seeMoreLink && (
                    <Link
                        href={seeMoreLink}
                        className="text-sm font-bold text-red-500 hover:underline transition uppercase tracking-wider"
                    >
                        View all →
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        title={product.title}
                        subtitle={product.subtitle}
                        rating={product.rating}
                        reviews={product.reviews}
                        author={product.author}
                        price={product.price}
                        imageSrc={product.imageSrc}
                        category={product.category}
                        link={product.link}
                    />
                ))}
            </div>
        </section>
    );
}
