"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import TitleInputForm from "./TitleInputForm"
import { Button } from "../ui/button"
import DeleteButton from "@/components/banner-announcements/DeleteButton"
import { createClient } from "@/lib/supabase/client"
import { ProductCard } from "../ProductCard"
import { Search, ChevronLeft, ChevronRight, Star, Box, Plus, Trash2 } from "lucide-react"
import { Input } from "../ui/input"
import { Card } from "../ui/card"
import Image from "next/image"

type ListType = "views" | "downloads" | "ratings" | "favorites" | "featured"

type ListBannerContent = {
    title: string
    subtitle: string
    listType: ListType
    selectedProductIds: string[]
}

type Props = {
    block: {
        id: string
        content: ListBannerContent
    }
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

const ConfigureListBanner = ({ block }: Props) => {
    const supabase = createClient()

    // Form State
    const [form, setForm] = useState<ListBannerContent>({
        title: block?.content?.title || "",
        subtitle: block?.content?.subtitle || "",
        listType: block?.content?.listType || "views",
        selectedProductIds: block?.content?.selectedProductIds || [],
    })

    // Search & Selection State
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState("newest")
    const [filterBy, setFilterBy] = useState("all")
    const [addViaId, setAddViaId] = useState("")
    const [searchedProducts, setSearchedProducts] = useState<Product[]>([])
    const [searchPage, setSearchPage] = useState(0)
    const [previewProducts, setPreviewProducts] = useState<Product[]>([])
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)
    const [isLoadingSearch, setIsLoadingSearch] = useState(false)

    const ITEMS_PER_PAGE = 5

    // Derived See More Link
    const seeMoreLink = useMemo(() => {
        if (form.listType === "featured") return ""
        const baseUrl = "localhost:3000/product-listing"
        const params = new URLSearchParams()

        switch (form.listType) {
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
    }, [form.listType])

    const handleChange = (field: keyof ListBannerContent, value: any) => {
        setForm((prev) => ({
            ...prev,
            [field]: value
        }))
    }

    // Fetch Preview Products based on List Type
    const fetchPreviewProducts = useCallback(async () => {
        setIsLoadingPreview(true)
        try {
            let products: Product[] = []

            if (form.listType === "featured") {
                if (form.selectedProductIds.length > 0) {
                    const { data, error } = await supabase
                        .from("products")
                        .select("*")
                        .in("product_id", form.selectedProductIds)

                    if (data) {
                        products = await mapProducts(data)
                        // Maintain order of selectedProductIds
                        products = form.selectedProductIds
                            .map(id => products.find(p => p.id === id))
                            .filter(Boolean) as Product[]
                    }
                }
            } else {
                // Auto-selection logic
                let query = supabase
                    .from("products")
                    .select("*")
                    .eq("product_status", "published")
                    .limit(5)

                if (form.listType === "views") {
                    // Fallback to newest if views column doesn't exist or is empty
                    query = query.order("created_at", { ascending: false })
                } else if (form.listType === "ratings") {
                    // In a real scenario, we might need a more complex join or a view
                    // For now, let's fetch products and their average ratings
                    // This is simplified. Ideally, use a RPC or a more optimized query.
                    query = query.order("created_at", { ascending: false })
                } else if (form.listType === "favorites") {
                    // Simplified
                    query = query.order("created_at", { ascending: false })
                }

                const { data, error } = await query
                if (data) {
                    products = await mapProducts(data)
                }
            }

            setPreviewProducts(products)
        } catch (err) {
            console.error("Error fetching preview products:", err)
        } finally {
            setIsLoadingPreview(false)
        }
    }, [form.listType, form.selectedProductIds])

    // Fetch Search Products
    const fetchSearchProducts = useCallback(async () => {
        if (form.listType !== "featured") return
        setIsLoadingSearch(true)
        try {
            let query = supabase
                .from("products")
                .select("*")
                .eq("product_status", "published")

            if (searchQuery) {
                query = query.ilike("product_name", `%${searchQuery}%`)
            }

            // Apply sort
            if (sortBy === "newest") {
                query = query.order("created_at", { ascending: false })
            } else if (sortBy === "oldest") {
                query = query.order("created_at", { ascending: true })
            }

            const { data, error } = await query.limit(20) // Fetch more than needed for pagination simulation
            if (data) {
                const mapped = await mapProducts(data)
                setSearchedProducts(mapped)
            }
        } catch (err) {
            console.error("Error searching products:", err)
        } finally {
            setIsLoadingSearch(false)
        }
    }, [searchQuery, sortBy, filterBy, form.listType])

    // Helper to map Supabase products to Product type
    const mapProducts = async (rows: any[]): Promise<Product[]> => {
        return Promise.all(rows.map(async (row) => {
            const pid = row.product_id

            // Fetch rating stats
            const { data: reviews } = await supabase
                .from("reviews")
                .select("rating")
                .eq("product_id", pid)

            const rating = reviews?.length
                ? reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviews.length
                : 0

            // Get thumbnail URL
            const { data: files } = await supabase.storage
                .from("asset_photos")
                .list(`${pid}/photos/thumbnail`)

            let imageSrc = "/pithos/PithosThumbnail.png"
            if (files && files.length > 0) {
                const { data: pubUrl } = supabase.storage
                    .from("asset_photos")
                    .getPublicUrl(`${pid}/photos/thumbnail/${files[0].name}`)
                if (pubUrl.publicUrl) imageSrc = pubUrl.publicUrl
            }

            const { data: userData } = await supabase
                .from("users")
                .select("user_fullname")
                .eq("id", row.seller_owner_id)
                .single()

            return {
                id: pid,
                title: row.product_name,
                subtitle: row.product_name,
                rating: parseFloat(rating.toFixed(1)),
                reviews: reviews?.length || 0,
                author: userData?.user_fullname || "Unknown seller",
                price: row.price <= 0 ? "Free" : `₱${row.price}`,
                imageSrc,
                link: `/product-detail/${pid}`
            }
        }))
    }

    useEffect(() => {
        fetchPreviewProducts()
    }, [fetchPreviewProducts])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSearchProducts()
        }, 500)
        return () => clearTimeout(timer)
    }, [fetchSearchProducts])

    const handleAddProduct = (productId: string) => {
        if (form.selectedProductIds.length >= 5) {
            alert("Maximum of 5 products allowed")
            return
        }
        if (form.selectedProductIds.includes(productId)) {
            alert("Product already added")
            return
        }
        handleChange("selectedProductIds", [...form.selectedProductIds, productId])
    }

    const handleRemoveProduct = (productId: string) => {
        handleChange("selectedProductIds", form.selectedProductIds.filter(id => id !== productId))
    }

    const handleAddViaId = async () => {
        if (!addViaId) return
        const { data, error } = await supabase
            .from("products")
            .select("product_id")
            .eq("product_id", addViaId)
            .single()

        if (error || !data) {
            alert("Invalid Product ID")
        } else {
            handleAddProduct(data.product_id)
            setAddViaId("")
        }
    }

    const paginatedSearchProducts = searchedProducts.slice(
        searchPage * ITEMS_PER_PAGE,
        (searchPage + 1) * ITEMS_PER_PAGE
    )

    return (
        <div className='p-8 flex flex-col gap-8 bg-card rounded-lg border border-muted'>

            {/* Header */}
            <h1 className="text-2xl font-bold">Configure List Banner</h1>

            {/* Title Input Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TitleInputForm
                    title="Title"
                    placeholder="Enter list title"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                />
                <TitleInputForm
                    title="SubTitle"
                    placeholder="Enter subtitle"
                    value={form.subtitle}
                    onChange={(e) => handleChange("subtitle", e.target.value)}
                />

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-muted-foreground">List Type</label>
                    <select
                        value={form.listType}
                        onChange={(e) => handleChange("listType", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="views">Views</option>
                        <option value="downloads">Downloads</option>
                        <option value="ratings">Ratings</option>
                        <option value="favorites">Favorites</option>
                        <option value="featured">Featured</option>
                    </select>
                </div>

                {form.listType !== "featured" && (
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-muted-foreground text-red-500">See More Link (Read-only)</label>
                        <Input
                            value={seeMoreLink}
                            readOnly
                            className="bg-muted text-muted-foreground cursor-not-allowed border-red-200"
                        />
                    </div>
                )}
            </div>

            {/* Select Products Section (Featured Only) */}
            {form.listType === "featured" && (
                <div className="flex flex-col gap-6 p-6 border border-dashed border-primary/30 rounded-xl bg-primary/5">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold">Select Maximum of (5) products</h2>
                        <p className="text-sm text-muted-foreground">View added products in preview section.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Search Products</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Filter By</label>
                            <select
                                value={filterBy}
                                onChange={(e) => setFilterBy(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="all">All Categories</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Add Via Id</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Paste UUID..."
                                    value={addViaId}
                                    onChange={(e) => setAddViaId(e.target.value)}
                                />
                                <Button onClick={handleAddViaId} size="icon">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Selection Section */}
                    <div className="relative group">
                        <div className="flex items-center gap-4 overflow-hidden py-4 px-2">
                            {isLoadingSearch ? (
                                <div className="w-full text-center py-10 text-muted-foreground">Searching...</div>
                            ) : paginatedSearchProducts.length > 0 ? (
                                paginatedSearchProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => handleAddProduct(product.id)}
                                        className="flex-shrink-0 w-[200px] cursor-pointer group/card relative"
                                    >
                                        <Card className={`overflow-hidden transition-all hover:ring-2 hover:ring-primary ${form.selectedProductIds.includes(product.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                                            <div className="relative aspect-video w-full">
                                                <Image
                                                    src={product.imageSrc}
                                                    alt={product.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                                {form.selectedProductIds.includes(product.id) && (
                                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                        <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">ADDED</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3 space-y-1">
                                                <h3 className="text-sm font-bold truncate">{product.title}</h3>
                                                <p className="text-xs text-muted-foreground truncate">{product.author}</p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-primary">{product.price}</span>
                                                    <div className="flex items-center gap-0.5">
                                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-[10px] font-medium">{product.rating}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                        <div className="absolute -top-2 -right-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                            <div className="bg-primary text-primary-foreground p-1 rounded-full shadow-lg">
                                                <Plus className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="w-full text-center py-10 text-muted-foreground">No products found.</div>
                            )}
                        </div>

                        {/* Navigation Arrows */}
                        {searchPage > 0 && (
                            <button
                                onClick={() => setSearchPage(p => p - 1)}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-background border border-muted p-2 rounded-full shadow-md hover:bg-muted transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                        )}
                        {(searchPage + 1) * ITEMS_PER_PAGE < searchedProducts.length && (
                            <button
                                onClick={() => setSearchPage(p => p + 1)}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-background border border-muted p-2 rounded-full shadow-md hover:bg-muted transition-colors"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Preview Section */}
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-end border-b pb-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold">Preview Section</h2>
                        <p className="text-sm text-muted-foreground">Lively shows what users will see in the homepage.</p>
                    </div>
                    {form.listType === "featured" && (
                        <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                            {form.selectedProductIds.length}/5 Selected
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-8 bg-background p-8 rounded-xl border border-muted shadow-sm">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold tracking-tight">{form.title || "List Title"}</h2>
                            <p className="text-muted-foreground">{form.subtitle || "List Subtitle"}</p>
                        </div>
                        {form.listType !== "featured" && (
                            <Button variant="link" className="text-red-500 font-bold p-0">
                                SEE MORE &gt;
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {isLoadingPreview ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="aspect-[3/4] rounded-lg bg-muted animate-pulse" />
                            ))
                        ) : previewProducts.length > 0 ? (
                            previewProducts.map((product) => (
                                <div key={product.id} className="relative group">
                                    <ProductCard
                                        {...product}
                                    />
                                    {form.listType === "featured" && (
                                        <button
                                            onClick={() => handleRemoveProduct(product.id)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                                No products to display. {form.listType === 'featured' ? 'Add products above.' : 'Check your database.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Save or Delete */}
            <div className="flex justify-end gap-2 border-t pt-6">
                <DeleteButton />

                <Button
                    onClick={async () => {
                        try {
                            const res = await fetch("/api/homepage-blocks/update", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    id: block.id,
                                    content: form
                                })
                            })

                            const data = await res.json()

                            if (!res.ok) {
                                throw new Error(data.error)
                            }

                            alert("Saved successfully!")
                        } catch (err) {
                            console.error("Save failed:", err)
                            alert("Failed to save banner")
                        }
                    }}
                >
                    Save
                </Button>
            </div>
        </div>
    )
}

export default ConfigureListBanner
