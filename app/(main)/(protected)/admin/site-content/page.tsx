"use client"

import { useEffect, useState, useRef } from "react"
import ConfigureSmallBanner from "@/components/banner-announcements/ConfigureSmallBanner"
import ConfigureBigBanner from "@/components/banner-announcements/ConfigureBigBanner"
import ConfigureListBanner from "@/components/banner-announcements/ConfigureListBanner"
import { Button } from "@/components/ui/button"
import { PackagePlus, ArrowLeft, Save, Layout, Layers, List, Loader2, Sparkles, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"

type Block = {
    id: string
    type: "small_banner" | "big_banner" | "list_banner"
    order_index: number
    content: any
}

const Page = () => {
    const [blocks, setBlocks] = useState<Block[]>([])
    const [loading, setLoading] = useState(true)
    const [isSavingAll, setIsSavingAll] = useState(false)
    const [isCreating, setIsCreating] = useState<string | null>(null)

    // Refs for calling save() on each banner component
    const bannerRefs = useRef<{ [key: string]: any }>({})

    const fetchBlocks = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/homepage-blocks")
            const data = await res.json()
            setBlocks(data)
        } catch (err) {
            console.error("Failed to fetch blocks:", err)
            toast.error("Failed to load site content")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBlocks()
    }, [])

    const handleCreateBanner = async (type: string) => {
        setIsCreating(type)
        try {
            const res = await fetch("/api/homepage-blocks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type })
            })
            if (!res.ok) throw new Error("Failed to create")
            const newBlock = await res.json()
            setBlocks([...blocks, newBlock])
            toast.success(`${type.replace("_", " ")} created successfully`)
        } catch (err) {
            console.error(err)
            toast.error("Failed to create banner")
        } finally {
            setIsCreating(null)
        }
    }

    const handleSaveAll = async () => {
        setIsSavingAll(true)
        try {
            const savePromises = blocks.map(block => {
                const ref = bannerRefs.current[block.id]
                if (ref?.save) return ref.save()
                return Promise.resolve(true)
            })

            const results = await Promise.all(savePromises)
            if (results.every(r => r === true)) {
                toast.success("All changes saved successfully!")
            } else {
                toast.error("Some banners failed to save. Please check and try again.")
            }
        } catch (err) {
            console.error(err)
            toast.error("An error occurred while saving")
        } finally {
            setIsSavingAll(false)
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/30">
            {/* Top Bar */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">Site Content Manager</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={fetchBlocks}
                        disabled={loading}
                        className="rounded-full px-6"
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 p-4 min-h-0 h-full overflow-y-auto max-w-[1600px] mx-auto w-full">
                {/* Left Column: Banner List */}
                <div className="flex-1 space-y-8 min-h-0 h-full overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            <p className="text-muted-foreground font-medium">Loading your site content...</p>
                        </div>
                    ) : blocks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed rounded-3xl bg-background/50 text-center px-4">
                            <div className="p-4 bg-muted rounded-full mb-4">
                                <Layers className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                            <h2 className="text-xl font-bold">No Content Yet</h2>
                            <p className="text-muted-foreground max-w-sm mt-2">
                                Your homepage is currently empty. Use the creation panel on the right to add banners and lists.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {blocks.map((block) => (
                                <div key={block.id} className="scroll-mt-24">
                                    {block.type === "small_banner" && (
                                        <ConfigureSmallBanner
                                            block={block}
                                            ref={(el: any) => bannerRefs.current[block.id] = el}
                                        />
                                    )}
                                    {block.type === "big_banner" && (
                                        <ConfigureBigBanner
                                            block={block}
                                            ref={(el: any) => bannerRefs.current[block.id] = el}
                                        />
                                    )}
                                    {block.type === "list_banner" && (
                                        <ConfigureListBanner
                                            block={block}
                                            ref={(el: any) => bannerRefs.current[block.id] = el}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Sticky Controls */}
                <div className="lg:w-[380px] shrink-0 min-h-0 h-full overflow-y-auto">
                    <div className="sticky top-24 space-y-6">
                        {/* Creation Panel */}
                        <Card className="p-6 border-2 border-muted shadow-md rounded-3xl bg-card overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 -mr-4 -mt-4 opacity-5 pointer-events-none">
                                <Sparkles className="h-32 w-32" />
                            </div>

                            <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                                <PackagePlus className="h-5 w-5 text-primary" />
                                Create New Content
                            </h2>

                            <div className="grid gap-3">
                                <Button
                                    variant="outline"
                                    className="h-auto py-4 px-4 justify-start gap-4 rounded-2xl border-2 hover:border-primary hover:bg-primary transition-all group"
                                    onClick={() => handleCreateBanner("small_banner")}
                                    disabled={!!isCreating}
                                >
                                    <div className="p-2 bg-red-100 text-red-600 rounded-xl group-hover:scale-110 transition-transform">
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-sm">Small Banner</div>
                                        <div className="text-[10px] text-muted-foreground">Info bar with icons</div>
                                    </div>
                                    {isCreating === "small_banner" && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto py-4 px-4 justify-start gap-4 rounded-2xl border-2 hover:border-primary hover:bg-primary transition-all group"
                                    onClick={() => handleCreateBanner("big_banner")}
                                    disabled={!!isCreating}
                                >
                                    <div className="p-2 bg-red-100 text-red-600 rounded-xl group-hover:scale-110 transition-transform">
                                        <Layout className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-sm">Big Banner</div>
                                        <div className="text-[10px] text-muted-foreground">Main hero section</div>
                                    </div>
                                    {isCreating === "big_banner" && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-auto py-4 px-4 justify-start gap-4 rounded-2xl border-2 hover:border-primary hover:bg-primary transition-all group"
                                    onClick={() => handleCreateBanner("list_banner")}
                                    disabled={!!isCreating}
                                >
                                    <div className="p-2 bg-red-100 text-red-600 rounded-xl group-hover:scale-110 transition-transform">
                                        <List className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-sm">List Banner</div>
                                        <div className="text-[10px] text-muted-foreground">Product grid display</div>
                                    </div>
                                    {isCreating === "list_banner" && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                                </Button>
                            </div>
                        </Card>

                        {/* Save Panel */}
                        {blocks.length > 0 && (
                            <Card className="p-6 border-2 border-muted shadow-md rounded-3xl bg-card text-primary overflow-hidden relative">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-white/20 rounded-xl">
                                            <Save className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-black">Unsaved Changes</h3>
                                            <p className="text-[10px] opacity-80">You have {blocks.length} blocks being edited</p>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full bg-accent font-black rounded-2xl py-6 shadow-lg transition-all active:scale-95"
                                        onClick={handleSaveAll}
                                        disabled={isSavingAll}
                                        variant="red_default"
                                    >
                                        {isSavingAll ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                SAVING...
                                            </>
                                        ) : (
                                            "SAVE ALL CHANGES"
                                        )}
                                    </Button>

                                    <div className="mt-4 flex items-start gap-2 text-[9px] opacity-70 italic leading-tight">
                                        <AlertCircle className="h-3 w-3 shrink-0" />
                                        Saving will update the homepage immediately for all users.
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Page
