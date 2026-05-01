"use client"

import { useState } from "react"
import TitleInputForm from "./TitleInputForm"
import { Button } from "../ui/button"
import DeleteButton from "@/components/banner-announcements/DeleteButton"

type SmallBannerItem = {
    icon: string
    prefix: string
    highlight: string
    suffix: string
}

type SmallBannerContent = {
    items: SmallBannerItem[]
}

type Props = {
    block: {
        id: string
        content: SmallBannerContent
    }
}

const ConfigureSmallBanner = ({ block }: Props) => {
    const [items, setItems] = useState<SmallBannerItem[]>(
        block?.content?.items?.length
            ? block.content.items
            : [
                { icon: "", prefix: "", highlight: "", suffix: "" }
            ]
    )

    const handleChange = (
        index: number,
        field: keyof SmallBannerItem,
        value: string
    ) => {
        const updated = [...items]
        updated[index][field] = value
        setItems(updated)
    }

    const handleAdd = () => {
        setItems([
            ...items,
            { icon: "", prefix: "", highlight: "", suffix: "" }
        ])
    }

    return (
        <div className='p-8 flex flex-col gap-6 bg-card rounded-lg border border-muted'>

            {/* Title */}
            <h1 className="text-2xl font-bold">Edit Small Banner</h1>

            {/* Items */}
            <div className="flex flex-col gap-6">

                {items.map((item, index) => (
                    <div key={index} className="grid md:grid-cols-4 gap-4">

                        <TitleInputForm
                            title="Icon"
                            placeholder="e.g. Star"
                            value={item.icon}
                            onChange={(e: any) =>
                                handleChange(index, "icon", e.target.value)
                            }
                        />

                        <TitleInputForm
                            title="Prefix Text"
                            placeholder="e.g. Over"
                            value={item.prefix}
                            onChange={(e: any) =>
                                handleChange(index, "prefix", e.target.value)
                            }
                        />

                        <TitleInputForm
                            title="Highlight"
                            placeholder="e.g. 13,000"
                            value={item.highlight}
                            onChange={(e: any) =>
                                handleChange(index, "highlight", e.target.value)
                            }
                        />

                        <TitleInputForm
                            title="Suffix Text"
                            placeholder="e.g. top-rated assets"
                            value={item.suffix}
                            onChange={(e: any) =>
                                handleChange(index, "suffix", e.target.value)
                            }
                        />

                    </div>
                ))}

                {/* Add More */}
                <div className="flex justify-end">
                    <Button variant={"red_link"} onClick={handleAdd}>
                        Add More +
                    </Button>
                </div>

            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
                <DeleteButton />

                <Button
                    onClick={async () => {
                        try {
                            console.log("Saving Small Banner:", items)

                            const res = await fetch("/api/homepage-blocks/update", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    id: block.id,
                                    content: {
                                        items
                                    }
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

export default ConfigureSmallBanner