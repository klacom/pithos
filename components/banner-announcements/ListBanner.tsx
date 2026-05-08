"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ProductCard } from "../products/ProductCard"
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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

type Product = {
    id: string
    title: string
    subtitle: string
    rating: number
    reviews: number
    author: string
    price: string
    imageSrc: string
    link: string
}

export function ListBanner({ content }: Props) {
    const supabase = createClient();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const seeMoreLink = useMemo(() => {
        if (content.listType === "featured") return null;
        const baseUrl = "/product-listing"
        const params = new URLSearchParams()
        
        switch (content.listType) {
            case "views":
                params.set("sort", "views")
                break
            case "ratings":
                params.set("sort", "rating_desc")
                break
            case "favorites":
                params.set("sort", "favorites")
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
            let fetchedProducts: Product[] = [];

            if (content.listType === "featured") {
                if (content.selectedProductIds?.length > 0) {
                    const { data } = await supabase
                        .from("products")
                        .select("*")
                        .in("product_id", content.selectedProductIds);
                    
                    if (data) {
                        fetchedProducts = await mapProducts(data);
                        // Maintain order
                        fetchedProducts = content.selectedProductIds
                            .map(id => fetchedProducts.find(p => p.id === id))
                            .filter(Boolean) as Product[];
                    }
                }
            } else {
                let query = supabase
                    .from("products")
                    .select("*")
                    .eq("product_status", "published")
                    .limit(5);

                // Placeholder sorting for now
                if (content.listType === "views") {
                    query = query.order("created_at", { ascending: false });
                } else if (content.listType === "ratings") {
                    query = query.order("created_at", { ascending: false });
                } else if (content.listType === "favorites") {
                    query = query.order("created_at", { ascending: false });
                }

                const { data } = await query;
                if (data) {
                    fetchedProducts = await mapProducts(data);
                }
            }

            setProducts(fetchedProducts);
        } catch (err) {
            console.error("Error fetching list banner products:", err);
        } finally {
            setLoading(false);
        }
    }, [content.listType, content.selectedProductIds]);

    const mapProducts = async (rows: any[]): Promise<Product[]> => {
        return Promise.all(rows.map(async (row) => {
            const pid = row.product_id;
            
            const { data: reviews } = await supabase
                .from("reviews")
                .select("rating")
                .eq("product_id", pid);
            
            const rating = reviews?.length 
                ? reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviews.length 
                : 0;
            
            const { data: files } = await supabase.storage
                .from("asset_photos")
                .list(`${pid}/photos/thumbnail`);
            
            let imageSrc = "/pithos/PithosThumbnail.png";
            if (files && files.length > 0) {
                const { data: pubUrl } = supabase.storage
                    .from("asset_photos")
                    .getPublicUrl(`${pid}/photos/thumbnail/${files[0].name}`);
                if (pubUrl.publicUrl) imageSrc = pubUrl.publicUrl;
            }

            const { data: userData } = await supabase
                .from("users")
                .select("user_fullname, user_email")
                .eq("id", row.seller_owner_id)
                .single();

            const author = String(userData?.user_fullname || userData?.user_email?.split("@")[0] || "Unknown seller");

            return {
                id: pid,
                title: row.product_name,
                subtitle: row.product_name,
                rating: parseFloat(rating.toFixed(1)),
                reviews: reviews?.length || 0,
                author,
                price: row.price <= 0 ? "Free" : `₱${row.price}`,
                imageSrc,
                link: `/product-detail/${pid}`
            };
        }));
    };

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    if (loading) {
        return (
            <section className="w-full flex flex-col gap-5 py-8">
                <div className="h-10 w-48 bg-muted animate-pulse rounded" />
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            </section>
        );
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
                    <ProductCard key={product.id} {...product} />
                ))}
            </div>
        </section>
    );
}
