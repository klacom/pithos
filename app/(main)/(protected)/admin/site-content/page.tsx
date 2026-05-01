"use client"

import { useEffect, useState } from "react"
import ConfigureSmallBanner from "@/components/banner-announcements/ConfigureSmallBanner"
import ConfigureBigBanner from "@/components/banner-announcements/ConfigureBigBanner"
import ConfigureListBanner from "@/components/banner-announcements/ConfigureListBanner"
import { Button } from "@/components/ui/button"
import { PackagePlus, ArrowLeft } from "lucide-react"

type Block = {
    id: string
    type: "small_banner" | "big_banner" | "list_banner"
    order_index: number
    content: any
}

const Page = () => {
    const [mode, setMode] = useState<"list" | "choose">("list")
    const [pageTitle, setPageTitle] = useState("Edit Site Content")
    const [blocks, setBlocks] = useState<Block[]>([])
    const [loading, setLoading] = useState(true)

    const fetchBlocks = async () => {
        try {
            const res = await fetch("/api/homepage-blocks",{
                method: "GET"
            });
            const data = await res.json();
            setBlocks(data);
            // console.log("Homepage Blocks Data: ", data);
        } catch (err) {
            console.error("Failed to fetch blocks:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBlocks()
    }, [])

    const handleSelectBanner = (type: string) => {
        console.log("Selected:", type)
        setMode("list")
    }

    return (
        <div className='flex flex-col p-4 bg-background w-full gap-4 min-h-0 h-full'>

            {/* HEADER */}
            <div className="flex flex-row justify-between shrink-0">
                <h1 className='font-bold text-3xl'>{pageTitle}</h1>

                <Button
                    variant={"red_default"}
                    onClick={() => {
                        setMode(mode === "list" ? "choose" : "list")
                        setPageTitle(
                            pageTitle === "Edit Site Content"
                                ? "Choose Your Banner"
                                : "Edit Site Content"
                        )
                    }}
                >
                    {mode === "list" ? (
                        <>
                            <PackagePlus /> Create
                        </>
                    ) : (
                        <>
                            <ArrowLeft /> Go Back
                        </>
                    )}
                </Button>
            </div>

            <hr className="shrink-0" />

            {/* ===================== */}
            {/* BANNERS CONTENT */}
            {/* ===================== */}
            {mode === "list" && (
                <div className="flex flex-col gap-4 w-full flex-1 min-h-0 overflow-y-auto border border-muted rounded-xl p-4">

                    {loading && <p>Loading...</p>}

                    {!loading && blocks.length === 0 && (
                        <p className="text-muted-foreground">No banners yet.</p>
                    )}

                    {!loading &&
                        blocks.map((block) => {
                            switch (block.type) {
                                case "small_banner":
                                    return <ConfigureSmallBanner block={block} key={block.id}/>

                                case "big_banner":
                                    return <ConfigureBigBanner block={block} key={block.id} />

                                // case "list_banner":
                                //     return <ConfigureListBanner key={block.id} />

                                default:
                                    return null
                            }
                        })}
                </div>
            )}

            {/* ===================== */}
            {/* CHOOSE BANNER */}
            {/* ===================== */}
            {mode === "choose" && (
                <div className="flex flex-1 items-center justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        <div
                            onClick={() => {
                                handleSelectBanner("small_banner")
                                setPageTitle("Edit Site Content")
                            }}
                            className="cursor-pointer rounded-xl border border-muted p-6 hover:bg-muted transition flex flex-col items-center justify-between gap-4"
                        >
                            <div className="w-full h-full flex justify-center items-center">
                                <div className="w-[288px] h-[32px] bg-foreground rounded-md" />
                            </div>
                            <span className="text-sm font-medium">Small Banner</span>
                        </div>

                        <div
                            onClick={() => {
                                handleSelectBanner("big_banner")
                                setPageTitle("Edit Site Content")
                            }}
                            className="cursor-pointer rounded-xl border border-muted p-6 hover:bg-muted transition flex flex-col items-center justify-between gap-4"
                        >
                            <div className="w-full h-full flex justify-center items-center">
                                <div className="w-[288px] h-[192px] bg-foreground rounded-md" />
                            </div>
                            <span className="text-sm font-medium">Big Banner</span>
                        </div>

                        <div
                            onClick={() => {
                                handleSelectBanner("list_banner")
                                setPageTitle("Edit Site Content")
                            }}
                            className="cursor-pointer rounded-xl border border-muted p-6 hover:bg-muted transition flex flex-col items-center justify-between gap-4"
                        >
                            <div className="flex gap-1 w-full h-full justify-center items-center">
                                <div className="w-[72px] h-[72px] bg-foreground rounded" />
                                <div className="w-[72px] h-[72px] bg-foreground rounded" />
                                <div className="w-[72px] h-[72px] bg-foreground rounded" />
                                <div className="w-[72px] h-[72px] bg-foreground rounded" />
                            </div>
                            <span className="text-sm font-medium">List Banner</span>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}

export default Page