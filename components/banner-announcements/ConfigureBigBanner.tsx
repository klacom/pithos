"use client"

import { useState } from "react"
import TitleInputForm from "./TitleInputForm"
import { Button } from "../ui/button"
import TitleInputUpload from "./TitleInputUpload"
import DeleteButton from "@/components/banner-announcements/DeleteButton"

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

const ConfigureBigBanner = ({ block }: Props) => {
    console.log("Block Image Url: ", block?.content?.image_url);

    const [form, setForm] = useState<BigBannerContent>({
        label: block?.content?.label || "",
        title: block?.content?.title || "",
        emoji: block?.content?.emoji || "",
        description: block?.content?.description || "",
        cta_text: block?.content?.cta_text || "",
        cta_link: block?.content?.cta_link || "",
        image_url: block?.content?.image_url || "",
    })

    const handleChange = (field: keyof BigBannerContent, value: string) => {
        setForm((prev) => ({
            ...prev,
            [field]: value
        }))
    }

    return (
        <div className='p-8 flex flex-col gap-6 bg-card rounded-lg border border-muted'>

            {/* Title */}
            <h1 className="text-2xl font-bold">Edit Big Banner</h1>

            {/* TEXT CONTENT */}
            <div className="flex flex-col gap-4">
                <h2 className="font-semibold text-muted-foreground">Text Content</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 gap-y-4 ">

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
                        placeholder="e.g. 🚀 (optional)"
                        value={form.emoji}
                        onChange={(e) => handleChange("emoji", e.target.value)}
                    />

                    <TitleInputForm
                        title="Description"
                        placeholder="Enter description"
                        value={form.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                    />

                </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-4">
                <h2 className="font-semibold text-muted-foreground">Call To Action</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 gap-y-4">

                    <TitleInputForm
                        title="Button Text"
                        placeholder="e.g. SHOP SALE"
                        value={form.cta_text}
                        onChange={(e) => handleChange("cta_text", e.target.value)}
                    />

                    <TitleInputForm
                        title="Button Link"
                        placeholder="Enter redirect link"
                        value={form.cta_link}
                        onChange={(e) => handleChange("cta_link", e.target.value)}
                    />

                </div>
            </div>

            {/* IMAGE */}
            <div className="flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-muted-foreground">Banner Image</h2>

                <TitleInputUpload
                    placeholder="Enter Image URL here"
                    blockId={block.id}
                    onUploaded={(url: string) => handleChange("image_url", url)}
                    fetchedLink={form.image_url}
                />
                
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-2">
                <DeleteButton />

                <Button
                    onClick={async () => {
                        try {
                            console.log("Saving Big Banner:", form)

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

export default ConfigureBigBanner