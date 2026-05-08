"use client"

import { useState, useEffect, useCallback, useMemo, useImperativeHandle, forwardRef } from "react"
import TitleInputForm from "./TitleInputForm"
import { Button } from "../ui/button"
import DeleteButton from "@/components/banner-announcements/DeleteButton"
import { createClient } from "@/lib/supabase/client"
import { ProductCard } from "../products/ProductCard"
import { Search, ChevronLeft, ChevronRight, Star, Box, Plus, Trash2, Loader2 } from "lucide-react"
import { Input } from "../ui/input"
import { Card } from "../ui/card"
import Image from "next/image"
import { mapProductRows, MappedProduct } from "@/lib/products"
import { ProductCardSkeleton } from "./BannerSkeletons"

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

const ConfigureListBanner = forwardRef(({ block }: Props, ref) => {
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
    const [searchedProducts, setSearchedProducts] = useState<MappedProduct[]>([])
    const [searchPage, setSearchPage] = useState(0)
    const [previewProducts, setPreviewProducts] = useState<MappedProduct[]>([])
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)
    const [isLoadingSearch, setIsLoadingSearch] = useState(false)

    const ITEMS_PER_PAGE = 5

    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await fetch("/api/homepage-blocks/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: block.id,
                    content: form
                })
            })
            if (!res.ok) throw new Error("Failed to save")
            return true
        } catch (err) {
            console.error(err)
            return false
        } finally {
            setIsSaving(false)
        }
    }

    useImperativeHandle(ref, () => ({
        save: handleSave
    }))

    // Derived See More Link
    const seeMoreLink = useMemo(() => {
        if (form.listType === "featured") return ""
        const baseUrl = "/product-listing"
        const params = new URLSearchParams()

        switch (form.listType) {
            case "views":
                params.set("sort", "relevance")
                break
            case "ratings":
                params.set("sort", "rating_desc")
                break
            case "favorites":
                params.set("sort", "relevance")
                break
            default:
                break
        }
        return `${baseUrl}?${params.toString()}`
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
            let products: MappedProduct[] = []

            if (form.listType === "featured") {
                if (form.selectedProductIds.length > 0) {
                    const { data, error } = await supabase
                        .from("products")
                        .select("*")
                        .in("product_id", form.selectedProductIds)

                    if (data) {
                        const mapped = await mapProductRows(supabase, data)
                        // Maintain order of selectedProductIds
                        products = form.selectedProductIds
                            .map(id => mapped.find(p => p.id === id))
                            .filter(Boolean) as MappedProduct[]
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
                    query = query.order("created_at", { ascending: false })
                } else if (form.listType === "ratings") {
                    query = query.order("created_at", { ascending: false })
                } else if (form.listType === "favorites") {
                    query = query.order("created_at", { ascending: false })
                }

                const { data, error } = await query
                if (data) {
                    products = await mapProductRows(supabase, data)
                }
            }

            setPreviewProducts(products)
        } catch (err) {
            console.error("Error fetching preview products:", err)
        } finally {
            setIsLoadingPreview(false)
        }
    }, [form.listType, form.selectedProductIds, supabase])

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

            const { data, error } = await query.limit(20)
            if (data) {
                const mapped = await mapProductRows(supabase, data)
                setSearchedProducts(mapped)
            }
        } catch (err) {
            console.error("Error searching products:", err)
        } finally {
            setIsLoadingSearch(false)
        }
    }, [searchQuery, sortBy, form.listType, supabase])

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
        <div className='p-8 flex flex-col gap-8 bg-card rounded-xl border border-muted shadow-sm hover:shadow-md transition-shadow'>
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Box className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">List Banner</h1>
                        <p className="text-sm text-muted-foreground">Dynamic or curated product list</p>
                    </div>
                </div>
                <DeleteButton />
            </div>

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
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 flex items-center gap-2">
                            <div className="flex-1 flex flex-col gap-2">
                                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Add by ID</label>
                                <Input
                                    placeholder="Paste product ID here..."
                                    value={addViaId}
                                    onChange={(e) => setAddViaId(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleAddViaId} variant="red_default" className="mt-6">Add</Button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                            {isLoadingSearch ? (
                                Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)
                            ) : paginatedSearchProducts.length > 0 ? (
                                paginatedSearchProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="relative group/card cursor-pointer"
                                        onClick={() => handleAddProduct(product.id)}
                                    >
                                        <Card className={`overflow-hidden transition-all hover:ring-2 hover:ring-primary ${form.selectedProductIds.includes(product.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                                            <div className="relative aspect-video w-full">
                                                <Image
                                                    src={product.imageSrc}
                                                    alt={product.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Plus className="h-8 w-8 text-white" />
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h3 className="text-xs font-bold truncate">{product.title}</h3>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-[10px] text-primary font-bold">{product.price}</span>
                                                    <div className="flex items-center gap-0.5">
                                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-[10px] font-medium">{product.rating}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                        {form.selectedProductIds.includes(product.id) && (
                                            <div className="absolute -top-2 -right-2 bg-primary text-white p-1 rounded-full shadow-lg">
                                                <Plus className="h-4 w-4 rotate-45" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="w-full text-center py-10 text-muted-foreground col-span-full">No products found.</div>
                            )}
                        </div>

                        {/* Navigation Arrows */}
                        {searchedProducts.length > ITEMS_PER_PAGE && (
                            <div className="flex justify-center gap-4 mt-6">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={searchPage === 0}
                                    onClick={() => setSearchPage(prev => prev - 1)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={(searchPage + 1) * ITEMS_PER_PAGE >= searchedProducts.length}
                                    onClick={() => setSearchPage(prev => prev + 1)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Preview Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-dashed pb-4">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold">Lively Preview</h2>
                        <p className="text-sm text-muted-foreground">Shows what users will see in the homepage.</p>
                    </div>
                    {form.listType === "featured" && (
                        <span className="text-xs font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
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
                            Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)
                        ) : previewProducts.length > 0 ? (
                            previewProducts.map((product) => (
                                <div key={product.id} className="relative group">
                                    <ProductCard
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

            {/* Save or Delete Section Removed - now in sticky container */}
        </div>
    )
})

ConfigureListBanner.displayName = "ConfigureListBanner"

export default ConfigureListBanner
