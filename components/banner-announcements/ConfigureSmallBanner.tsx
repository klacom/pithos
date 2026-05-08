"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import TitleInputForm from "./TitleInputForm"
import { Button } from "../ui/button"
import DeleteButton from "@/components/banner-announcements/DeleteButton"
import { Plus, Trash2, Layout, Info, Star, Truck, ShieldCheck, Tag } from "lucide-react"
import { Input } from "../ui/input"

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

const ConfigureSmallBanner = forwardRef(({ block }: Props, ref) => {
    const [items, setItems] = useState<SmallBannerItem[]>(
        block?.content?.items?.length
            ? block.content.items
            : [
                { icon: "Truck", prefix: "Free Shipping", highlight: "on orders over ₱500", suffix: "" }
            ]
    )

    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await fetch("/api/homepage-blocks/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: block.id,
                    content: { items }
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
            { icon: "Star", prefix: "", highlight: "", suffix: "" }
        ])
    }

    const handleRemove = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const iconOptions = [
        { label: "Truck", icon: Truck },
        { label: "Shield", icon: ShieldCheck },
        { label: "Star", icon: Star },
        { label: "Tag", icon: Tag },
    ]

    return (
        <div className='p-8 flex flex-col gap-8 bg-card rounded-xl border border-muted shadow-sm hover:shadow-md transition-shadow'>
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Layout className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Small Banner</h1>
                        <p className="text-sm text-muted-foreground">Information bar with highlights and icons</p>
                    </div>
                </div>
                <DeleteButton />
            </div>

            <div className="flex flex-col gap-6">
                {items.map((item, index) => (
                    <div key={index} className="relative group p-6 rounded-xl border bg-muted/5 hover:bg-muted/10 transition-colors">
                        <button 
                            onClick={() => handleRemove(index)}
                            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Icon Name</label>
                                <Input
                                    placeholder="e.g. Truck, Star"
                                    value={item.icon}
                                    onChange={(e) => handleChange(index, "icon", e.target.value)}
                                />
                                <div className="flex gap-2 mt-2">
                                    {iconOptions.map((opt) => (
                                        <button
                                            key={opt.label}
                                            onClick={() => handleChange(index, "icon", opt.label)}
                                            className={`p-1.5 rounded border transition-all ${item.icon === opt.label ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-input text-muted-foreground hover:border-primary/50'}`}
                                        >
                                            <opt.icon className="h-3.5 w-3.5" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <TitleInputForm
                                title="Prefix Text"
                                placeholder="e.g. Free Shipping"
                                value={item.prefix}
                                onChange={(e: any) => handleChange(index, "prefix", e.target.value)}
                            />

                            <TitleInputForm
                                title="Highlight"
                                placeholder="e.g. on all orders"
                                value={item.highlight}
                                onChange={(e: any) => handleChange(index, "highlight", e.target.value)}
                            />

                            <TitleInputForm
                                title="Suffix Text"
                                placeholder="e.g. today only"
                                value={item.suffix}
                                onChange={(e: any) => handleChange(index, "suffix", e.target.value)}
                            />
                        </div>
                    </div>
                ))}

                <Button 
                    variant="outline" 
                    onClick={handleAdd}
                    className="w-full py-8 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                    <Plus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                    Add Another Information Item
                </Button>
            </div>

            {/* Preview Section */}
            <div className="space-y-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Live Preview</span>
                <div className="w-full py-3 px-6 bg-foreground text-background rounded-lg flex flex-wrap justify-center gap-x-8 gap-y-2 overflow-hidden">
                    {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                            {item.icon === "Truck" && <Truck className="h-3.5 w-3.5" />}
                            {item.icon === "Star" && <Star className="h-3.5 w-3.5" />}
                            {item.icon === "Shield" && <ShieldCheck className="h-3.5 w-3.5" />}
                            {item.icon === "Tag" && <Tag className="h-3.5 w-3.5" />}
                            <span className="opacity-80">{item.prefix}</span>
                            <span className="font-bold text-primary-foreground">{item.highlight}</span>
                            <span className="opacity-80">{item.suffix}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
})

ConfigureSmallBanner.displayName = "ConfigureSmallBanner"

export default ConfigureSmallBanner
