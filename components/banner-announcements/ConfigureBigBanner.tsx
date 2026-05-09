"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import TitleInputForm from "./TitleInputForm"
import { Button } from "../ui/button"
import TitleInputUpload from "./TitleInputUpload"
import DeleteButton from "@/components/banner-announcements/DeleteButton"
import { Link2, Type, AlignLeft, Image as ImageIcon, Sparkles, MousePointer2 } from "lucide-react"
import { Input } from "../ui/input"
import Image from "next/image"

type BigBannerContent = {
    label: string
    title: string
    emoji?: string
    description: string
    cta_text: string
    cta_link: string
    image_url: string
}

type Props = {
    block: {
        id: string
        content: BigBannerContent
    }
}

const ConfigureBigBanner = forwardRef(({ block }: Props, ref) => {
    const [form, setForm] = useState<BigBannerContent>({
        label: block?.content?.label || "",
        title: block?.content?.title || "",
        emoji: block?.content?.emoji || "",
        description: block?.content?.description || "",
        cta_text: block?.content?.cta_text || "",
        cta_link: block?.content?.cta_link || "",
        image_url: block?.content?.image_url || "",
    })

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

    const handleChange = (field: keyof BigBannerContent, value: string) => {
        setForm((prev) => ({
            ...prev,
            [field]: value
        }))
    }

    const quickLinks = [
        { label: "Product Listing", value: "/product-listing" },
        { label: "Favorites", value: "/buyer/favorites" },
        { label: "Cart", value: "/shopping-cart" },
    ]

    return (
        <div className='p-8 flex flex-col gap-8 bg-card rounded-xl border border-muted shadow-sm hover:shadow-md transition-shadow'>
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <ImageIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Big Banner</h1>
                        <p className="text-sm text-muted-foreground">Main hero section on your homepage</p>
                    </div>
                </div>
                <DeleteButton />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Content */}
                <div className="space-y-6">
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                            <Type className="h-4 w-4" />
                            Text Content
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TitleInputForm
                                title="Top Label"
                                placeholder="e.g. New Additions"
                                value={form.label}
                                onChange={(e) => handleChange("label", e.target.value)}
                            />
                            <TitleInputForm
                                title="Main Title"
                                placeholder="e.g. SPRING SALE"
                                value={form.title}
                                onChange={(e) => handleChange("title", e.target.value)}
                            />
                            <TitleInputForm
                                title="Emoji / Accent"
                                placeholder="e.g. 🚀"
                                value={form.emoji}
                                onChange={(e) => handleChange("emoji", e.target.value)}
                            />
                            <div className="md:col-span-2">
                                <TitleInputForm
                                    title="Description"
                                    placeholder="Enter short description..."
                                    value={form.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                            <MousePointer2 className="h-4 w-4" />
                            Call To Action
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TitleInputForm
                                title="Button Text"
                                placeholder="e.g. SHOP SALE"
                                value={form.cta_text}
                                onChange={(e) => handleChange("cta_text", e.target.value)}
                            />
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Button Link</label>
                                <div className="relative">
                                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="/product-listing"
                                        value={form.cta_link}
                                        onChange={(e) => handleChange("cta_link", e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {quickLinks.map((link) => (
                                        <button
                                            key={link.value}
                                            onClick={() => handleChange("cta_link", link.value)}
                                            className="text-[10px] px-2 py-1 bg-muted hover:bg-primary/10 hover:text-primary rounded-full transition-colors border border-transparent hover:border-primary/20"
                                        >
                                            {link.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Side: Media */}
                <div className="space-y-6">
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                            <ImageIcon className="h-4 w-4" />
                            Banner Media
                        </div>
                        <div className="rounded-xl border border-dashed border-muted p-4 bg-muted/5">
                            <TitleInputUpload
                                placeholder="Enter Image URL here"
                                blockId={block.id}
                                onUploaded={(url: string) => handleChange("image_url", url)}
                                fetchedLink={form.image_url}
                            />
                        </div>
                    </section>
                    
                    {/* Preview (Simplified) */}
                    <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Live Preview</span>
                        <div className="relative aspect-[21/9] rounded-lg overflow-hidden border bg-muted group">
                            {form.image_url ? (
                                form.image_url.toLowerCase().endsWith(".mp4") ? (
                                    <video
                                        src={form.image_url}
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                    />
                                ) : (
                                    <Image src={form.image_url} alt="Preview" fill className="object-cover" />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs italic">
                                    No media selected
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 flex flex-col justify-center p-4">
                                <span className="text-[10px] font-bold text-white/90 uppercase tracking-tighter">{form.label || "LABEL"}</span>
                                <h3 className="text-sm font-black text-white leading-none">{form.title || "TITLE"} {form.emoji}</h3>
                                <p className="text-[8px] text-white/80 line-clamp-1 mt-1 max-w-[60%]">{form.description}</p>
                                <div className="mt-2 w-fit px-3 py-1 bg-primary text-primary-foreground text-[8px] font-bold rounded">
                                    {form.cta_text || "CTA BUTTON"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
})

ConfigureBigBanner.displayName = "ConfigureBigBanner"

export default ConfigureBigBanner
