"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    BadgeCheck,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Download,
    FileArchive,
    FileImage,
    FileText,
    Heart,
    Layers3,
    Mail,
    PackageOpen,
    ShieldCheck,
    ShoppingCart,
    Sparkles,
    Star,
    Zap,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    addToCart,
    removeCartItem,
    toggleFavorite,
} from "@/app/shop-actions";

type Review = {
    id: string;
    rating: number;
    review_text: string | null;
    created_at: string;
    buyer_id?: string;
    buyer_name?: string;
};

type RelatedProduct = {
    id: string;
    title: string;
    subtitle: string;
    rating: number;
    reviews: number;
    author: string;
    price: string;
    imageSrc: string;
    link: string;
};

type ProductData = {
    product_id: string;
    product_name: string;
    product_description: string | null;
    price: number;
    created_at: string;
    product_status?: string | null;
    seller_owner_id: string;
};

type SellerData = {
    user_fullname?: string | null;
    user_email?: string | null;
    created_at?: string | null;
};

type ProductPayload = {
    product: ProductData;
    images: string[];
    packageFileNames: string[];
    user: SellerData | null;
};

const phpFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
});

const tabs = ["Overview", "Package Content", "Reviews", "Publisher Info"] as const;

function formatPeso(price: number) {
    return price <= 0 ? "Free" : phpFormatter.format(price);
}

function renderStars(rating: number, size = 16) {
    return Array.from({ length: 5 }).map((_, index) => (
        <Star
            key={`${rating}-${index}`}
            size={size}
            className={
                index < Math.round(rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/40"
            }
        />
    ));
}

function getFileIcon(fileName: string) {
    const lower = fileName.toLowerCase();

    if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(lower)) {
        return FileImage;
    }

    if (/\.(zip|rar|7z|blend|fbx|obj|glb|gltf|unitypackage)$/.test(lower)) {
        return FileArchive;
    }

    return FileText;
}

export default function ProductDetailPage() {
    const params = useParams<{ product_id: string }>();
    const product_id = params?.product_id;
    const router = useRouter();

    const [product, setProduct] = useState<ProductData | null>(null);
    const [images, setImages] = useState<string[]>([]);
    const [packageFileNames, setPackageFileNames] = useState<string[]>([]);
    const [seller, setSeller] = useState<SellerData | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [avgRating, setAvgRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);
    const [activeTab, setActiveTab] =
        useState<(typeof tabs)[number]>("Overview");
    const [moreFromSeller, setMoreFromSeller] = useState<RelatedProduct[]>([]);
    const [youMightLike, setYouMightLike] = useState<RelatedProduct[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isInCart, setIsInCart] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [isBusy, setIsBusy] = useState<"cart" | "favorite" | "buy" | "download" | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const currentImage = images[currentImageIndex] || "/pithos/PithosThumbnail.png";

    const parsedDescription = useMemo(() => {
        const description = product?.product_description?.trim() ?? "";
        const lines = description.split("\n").map((line) => line.trim()).filter(Boolean);

        const tagsLine = lines.find((line) => line.toLowerCase().startsWith("tags:"));
        const categoryLine = lines.find((line) =>
            line.toLowerCase().startsWith("category:"),
        );

        return {
            body:
                description ||
                "This asset includes ready-to-use files for your next scene, game, or creative workflow.",
            category: categoryLine?.split(":").slice(1).join(":").trim() || "Digital Asset",
            tags:
                tagsLine
                    ?.split(":")
                    .slice(1)
                    .join(":")
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean) ?? [],
        };
    }, [product]);

    useEffect(() => {
        if (!product_id) return;

        let ignore = false;

        async function loadPage() {
            setIsLoading(true);

            try {
                const [productRes, reviewsRes, viewerStateRes] = await Promise.all([
                    fetch(`/api/product/${product_id}`),
                    fetch(`/api/product/${product_id}/reviews`),
                    fetch(`/api/products/${product_id}/viewer-state`),
                ]);

                if (!productRes.ok) {
                    throw new Error("Product not found");
                }

                const productData = (await productRes.json()) as ProductPayload;
                const reviewsData = reviewsRes.ok ? await reviewsRes.json() : null;
                const viewerState = viewerStateRes.ok ? await viewerStateRes.json() : null;

                const [sellerProductsRes, suggestedRes] = await Promise.all([
                    fetch(
                        `/api/seller/${productData.product.seller_owner_id}/products?exclude=${product_id}&limit=4`,
                    ),
                    fetch(`/api/products/suggested?exclude=${product_id}&limit=4`),
                ]);

                const sellerProductsData = sellerProductsRes.ok
                    ? await sellerProductsRes.json()
                    : { products: [] };
                const suggestedData = suggestedRes.ok
                    ? await suggestedRes.json()
                    : { products: [] };

                if (ignore) return;

                setProduct(productData.product);
                setImages(productData.images ?? ["/pithos/PithosThumbnail.png"]);
                setPackageFileNames(productData.packageFileNames ?? []);
                setSeller(productData.user ?? null);
                setReviews(reviewsData?.reviews ?? []);
                setAvgRating(Number(reviewsData?.avgRating ?? 0));
                setReviewCount(Number(reviewsData?.reviewCount ?? 0));
                setMoreFromSeller(sellerProductsData.products ?? []);
                setYouMightLike(suggestedData.products ?? []);
                setIsInCart(Boolean(viewerState?.isInCart));
                setIsFavorite(Boolean(viewerState?.isFavorite));
                setIsOwner(Boolean(viewerState?.isOwner));
            } catch (error) {
                console.error(error);
                if (!ignore) {
                    toast.error("Unable to load this product right now.");
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        void loadPage();

        return () => {
            ignore = true;
        };
    }, [product_id]);

    useEffect(() => {
        if (images.length <= 1) return;

        const timer = window.setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 5000);

        return () => window.clearInterval(timer);
    }, [images]);

    useEffect(() => {
        if (currentImageIndex >= images.length) {
            setCurrentImageIndex(0);
        }
    }, [currentImageIndex, images.length]);

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const emitCartUpdated = () => {
        window.dispatchEvent(new CustomEvent("cart-updated"));
        // console.log("EVENT FIRED");
    };

    const handleAddToCart = async () => {
        if (!product_id) return;

        setIsBusy("cart");
        const result = isInCart
            ? await removeCartItem(product_id)
            : await addToCart(product_id);
        setIsBusy(null);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        setIsInCart(!isInCart);
        emitCartUpdated();
        toast.success(isInCart ? "Removed from your cart." : "Added to cart.");
    };

    const handleToggleFavorite = async () => {
        if (!product_id) return;

        setIsBusy("favorite");
        const result = await toggleFavorite(product_id);
        setIsBusy(null);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        const nextValue = result.action === "added";
        setIsFavorite(nextValue);
        toast.success(
            nextValue ? "Added to favorites." : "Removed from favorites.",
        );
    };

    const handleBuyNow = async () => {
        if (!product_id) return;

        setIsBusy("buy");
        const result = await addToCart(product_id);
        setIsBusy(null);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        setIsInCart(true);
        emitCartUpdated();
        // Redirect directly to checkout with this product
        router.push(`/shopping-cart/checkout?product_id=${product_id}`);
    };

    const handleDownload = async () => {
        if (!product_id) return;

        setIsBusy("download");
        try {
            const res = await fetch(`/api/products/${product_id}/download`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // Trigger download using the signed URL
            const a = document.createElement('a');
            a.href = data.downloadUrl;
            a.download = data.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            toast.success("Download started!");
        } catch (error: any) {
            console.error("Download failed:", error);
            toast.error(error.message || "Failed to download asset.");
        } finally {
            setIsBusy(null);
        }
    };

    if (isLoading || !product) {
        return (
            <main className="px-4 py-10 md:px-20 lg:px-32 xl:px-44 2xl:px-60">
                <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
                    Loading product details...
                </div>
            </main>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case "Overview":
                return (
                    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                        <Card className="p-6">
                            <div className="mb-4 flex items-center gap-2 text-sm text-accent">
                                <Sparkles size={16} />
                                Overview
                            </div>
                            <p className="whitespace-pre-wrap leading-7 text-muted-foreground">
                                {parsedDescription.body}
                            </p>
                        </Card>

                        <Card className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4 border-b pb-3">
                                    <span className="text-sm text-muted-foreground">Category</span>
                                    <span className="font-medium">{parsedDescription.category}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 border-b pb-3">
                                    <span className="text-sm text-muted-foreground">Published</span>
                                    <span className="font-medium">
                                        {new Date(product.created_at).toLocaleDateString("en-PH", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-4 border-b pb-3">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <span className="font-medium capitalize">
                                        {product.product_status || "published"}
                                    </span>
                                </div>
                                <div className="space-y-3 pt-1">
                                    <span className="text-sm text-muted-foreground">Highlights</span>
                                    <div className="flex flex-wrap gap-2">
                                        {(parsedDescription.tags.length > 0
                                            ? parsedDescription.tags
                                            : ["ready-to-use", "downloadable", "creator asset"]
                                        ).map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-full border bg-muted px-3 py-1 text-xs font-medium"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            case "Package Content":
                return (
                    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                        <Card className="p-6">
                            <div className="mb-5 flex items-center gap-2 text-sm text-accent">
                                <PackageOpen size={16} />
                                Files included in this product
                            </div>

                            {packageFileNames.length > 0 ? (
                                <div className="grid gap-3">
                                    {packageFileNames.map((fileName) => {
                                        const Icon = getFileIcon(fileName);
                                        return (
                                            <div
                                                key={fileName}
                                                className="flex items-center justify-between gap-4 rounded-2xl border bg-background/70 px-4 py-3"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="rounded-xl bg-accent/10 p-2 text-accent">
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium">{fileName}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Stored in `assets_storage`
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="rounded-full bg-muted px-3 py-1 text-xs uppercase text-muted-foreground">
                                                    {fileName.split(".").pop() || "file"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                                    No package files are currently listed for this asset.
                                </div>
                            )}
                        </Card>

                        <Card className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Download className="text-accent" size={18} />
                                    <div>
                                        <p className="font-medium">What to expect</p>
                                        <p className="text-sm text-muted-foreground">
                                            Buyers receive the same downloadable files uploaded by the
                                            publisher.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="text-accent" size={18} />
                                    <div>
                                        <p className="font-medium">Organized package</p>
                                        <p className="text-sm text-muted-foreground">
                                            File names stay visible here so the buyer knows what is inside
                                            before purchase.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            case "Reviews":
                return (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Community rating</p>
                                    <div className="mt-2 flex items-center gap-3">
                                        <span className="text-4xl font-bold">
                                            {avgRating.toFixed(1)}
                                        </span>
                                        <div>
                                            <div className="flex gap-1">{renderStars(avgRating, 18)}</div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Based on {reviewCount} review{reviewCount === 1 ? "" : "s"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-2xl border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                                    Sample reviews are auto-seeded when an asset has no feedback yet.
                                </div>
                            </div>
                        </Card>

                        <div className="grid gap-4">
                            {reviews.length > 0 ? (
                                reviews.map((review) => (
                                    <Card key={review.id} className="p-6">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div className="flex gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 font-semibold text-accent">
                                                    {(review.buyer_name || "VB").slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">
                                                        {review.buyer_name || "Verified buyer"}
                                                    </p>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <div className="flex gap-1">
                                                            {renderStars(review.rating, 14)}
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">
                                                            {review.rating}/5
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(review.created_at).toLocaleDateString("en-PH", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </p>
                                        </div>
                                        <p className="mt-4 leading-7 text-muted-foreground">
                                            {review.review_text || "No review text provided."}
                                        </p>
                                    </Card>
                                ))
                            ) : (
                                <Card className="p-6 text-muted-foreground">
                                    No reviews yet for this item.
                                </Card>
                            )}
                        </div>
                    </div>
                );

            case "Publisher Info":
                return (
                    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                        <Card className="p-6">
                            <div className="flex flex-col gap-5 md:flex-row md:items-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/10 text-2xl font-bold text-accent">
                                    {(seller?.user_fullname || "PU").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-2xl font-bold">
                                            {seller?.user_fullname || "Unknown Publisher"}
                                        </h3>
                                        <BadgeCheck className="text-accent" size={18} />
                                    </div>
                                    <p className="text-muted-foreground">
                                        Trusted publisher profile for this asset listing.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                                            Seller
                                        </span>
                                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                                            Digital creator
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="space-y-4 text-sm">
                                <div className="flex items-center gap-3">
                                    <Mail size={16} className="text-accent" />
                                    <div>
                                        <p className="text-muted-foreground">Contact</p>
                                        <p className="font-medium">
                                            {seller?.user_email || "Not publicly available"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CalendarDays size={16} className="text-accent" />
                                    <div>
                                        <p className="text-muted-foreground">Joined</p>
                                        <p className="font-medium">
                                            {seller?.created_at
                                                ? new Date(seller.created_at).toLocaleDateString("en-PH", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "Unknown"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Layers3 size={16} className="text-accent" />
                                    <div>
                                        <p className="text-muted-foreground">Listings previewed</p>
                                        <p className="font-medium">{moreFromSeller.length + 1} assets</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <main className="mb-10 flex flex-col gap-8 px-4 pt-6 md:px-14 lg:px-24 xl:px-32 2xl:px-44">
            <Button
                variant="red_ghost"
                className="w-fit px-0 hover:bg-transparent"
                onClick={() => router.back()}
            >
                <ArrowLeft size={16} />
                Go Back
            </Button>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_420px]">
                <div className="space-y-8">
                    <Card className="overflow-hidden border-none bg-transparent shadow-none">
                        <div className="relative overflow-hidden rounded-[28px] border bg-black">
                            <div className="absolute inset-0">
                                <Image
                                    fill
                                    src={currentImage}
                                    alt={product.product_name}
                                    className="object-cover blur-3xl opacity-30"
                                />
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/60" />

                            <div className="relative aspect-[16/10] overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentImage}
                                        initial={{ opacity: 0, scale: 1.03, x: 20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.98, x: -20 }}
                                        transition={{ duration: 0.45, ease: "easeOut" }}
                                        className="absolute inset-0"
                                    >
                                        <Image
                                            fill
                                            src={currentImage}
                                            alt={product.product_name}
                                            className="object-contain"
                                            sizes="(max-width: 1280px) 100vw, 900px"
                                        />
                                    </motion.div>
                                </AnimatePresence>

                                {images.length > 1 ? (
                                    <>
                                        <button
                                            onClick={handlePrevImage}
                                            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-3 text-white backdrop-blur transition hover:bg-black/60"
                                            aria-label="Previous image"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            onClick={handleNextImage}
                                            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-3 text-white backdrop-blur transition hover:bg-black/60"
                                            aria-label="Next image"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </>
                                ) : null}

                                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-sm text-white backdrop-blur">
                                    <Sparkles size={14} />
                                    {currentImageIndex + 1} / {images.length}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {images.map((image, index) => (
                                <button
                                    key={`${image}-${index}`}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className="shrink-0"
                                >
                                    <motion.div
                                        animate={{
                                            scale: currentImageIndex === index ? 1 : 0.96,
                                            opacity: currentImageIndex === index ? 1 : 0.68,
                                        }}
                                        className={`relative h-24 w-24 overflow-hidden rounded-2xl border ${currentImageIndex === index
                                            ? "border-accent shadow-lg shadow-accent/20"
                                            : "border-border"
                                            }`}
                                    >
                                        <Image
                                            fill
                                            src={image}
                                            alt={`${product.product_name} preview ${index + 1}`}
                                            className="object-cover"
                                            quality={20}
                                        />
                                    </motion.div>
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-center gap-2">
                            {images.map((_, index) => (
                                <button
                                    key={`dot-${index}`}
                                    onClick={() => setCurrentImageIndex(index)}
                                    aria-label={`Go to image ${index + 1}`}
                                    className={`h-2.5 rounded-full transition-all ${currentImageIndex === index
                                        ? "w-8 bg-accent"
                                        : "w-2.5 bg-gray-500/30"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    <Card className="overflow-hidden">
                        <div className="border-b bg-muted/40 px-3 py-2">
                            <div className="flex gap-2 overflow-x-auto">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeTab === tab
                                            ? "bg-accent text-accent-foreground"
                                            : "text-muted-foreground hover:bg-muted"
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-5 md:p-6">{renderTabContent()}</div>
                    </Card>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold">
                                More from {seller?.user_fullname || "this seller"}
                            </h2>
                        </div>
                        {moreFromSeller.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {moreFromSeller.map((item) => (
                                    <ProductCard key={item.id} {...item} />
                                ))}
                            </div>
                        ) : (
                            <Card className="p-6 text-muted-foreground">
                                No additional published products from this seller yet.
                            </Card>
                        )}
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold">You Might Like</h2>
                        </div>
                        {youMightLike.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {youMightLike.map((item) => (
                                    <ProductCard key={item.id} {...item} />
                                ))}
                            </div>
                        ) : (
                            <Card className="p-6 text-muted-foreground">
                                Loading recommendations...
                            </Card>
                        )}
                    </section>
                </div>

                <aside className="h-fit xl:sticky xl:top-20">
                    <Card className="overflow-hidden rounded-[28px] border-accent/10">
                        <div className="border-b bg-gradient-to-br from-accent/10 via-background to-background p-6">
                            <div className="mb-3 flex items-center gap-2 text-sm text-accent">
                                <Sparkles size={16} />
                                Featured digital asset
                            </div>
                            <h1 className="text-3xl font-bold leading-tight">
                                {product.product_name}
                            </h1>
                            <p className="mt-3 text-muted-foreground">
                                by {seller?.user_fullname || "Unknown Publisher"}
                            </p>

                            <div className="mt-5 flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">{renderStars(avgRating)}</div>
                                    <span className="font-semibold">{avgRating.toFixed(1)}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {reviewCount} review{reviewCount === 1 ? "" : "s"}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-6 p-6">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Price</p>
                                    <p className="text-4xl font-bold">{formatPeso(Number(product.price ?? 0))}</p>
                                </div>
                                {isInCart ? (
                                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-600">
                                        In cart
                                    </span>
                                ) : null}
                            </div>

                            <div className="grid gap-3">
                                {isOwner ? (
                                    <Button
                                        className="h-12 w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={handleDownload}
                                        disabled={isBusy !== null}
                                    >
                                        <Download size={18} />
                                        {isBusy === "download" ? "Downloading..." : "Download Asset"}
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            variant={isInCart ? "outline" : "red_default"}
                                            className="h-12 w-full"
                                            onClick={handleAddToCart}
                                            disabled={isBusy !== null}
                                        >
                                            <ShoppingCart size={18} />
                                            {isBusy === "cart"
                                                ? isInCart
                                                    ? "Removing..."
                                                    : "Adding..."
                                                : isInCart
                                                    ? "Remove From Your Cart"
                                                    : "Add To Cart"}
                                        </Button>

                                        <Button
                                            className="h-12 w-full"
                                            onClick={handleBuyNow}
                                            disabled={isBusy !== null}
                                        >
                                            <Zap size={18} />
                                            {isBusy === "buy" ? "Preparing..." : "Buy Now"}
                                        </Button>
                                    </>
                                )}

                                <Button
                                    variant={isFavorite ? "red_ghost" : "outline"}
                                    className="h-12 w-full"
                                    onClick={handleToggleFavorite}
                                    disabled={isBusy !== null}
                                >
                                    <Heart
                                        size={18}
                                        className={isFavorite ? "fill-current" : ""}
                                    />
                                    {isBusy === "favorite"
                                        ? "Updating..."
                                        : isFavorite
                                            ? "Favorited"
                                            : "Add To Favorites"}
                                </Button>
                            </div>

                            <div className="grid gap-3 rounded-2xl bg-muted/40 p-4">
                                <div className="flex items-start gap-3">
                                    <PackageOpen size={18} className="mt-0.5 text-accent" />
                                    <div>
                                        <p className="font-medium">Package content</p>
                                        <p className="text-sm text-muted-foreground">
                                            {packageFileNames.length > 0
                                                ? `${packageFileNames.length} file${packageFileNames.length === 1 ? "" : "s"
                                                } ready for download`
                                                : "Package file list will appear here once available"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <ShieldCheck size={18} className="mt-0.5 text-accent" />
                                    <div>
                                        <p className="font-medium">Direct checkout path</p>
                                        <p className="text-sm text-muted-foreground">
                                            Buy Now places this item into your cart so you can continue to
                                            checkout flow right away.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Download size={18} className="mt-0.5 text-accent" />
                                    <div>
                                        <p className="font-medium">Digital delivery</p>
                                        <p className="text-sm text-muted-foreground">
                                            No tax added yet. Total uses Philippine Peso pricing only.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    );
}
