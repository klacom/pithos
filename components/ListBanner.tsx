"use client";

import { ProductCard } from "./ProductCard";

export function ListBanner() {
    const assets = [
        {
            title: "ROCK & BOULDERS 2",
            subtitle: "Rock and Boulders 2",
            rating: 4.7,
            reviews: 611,
            author: "Manufactura K4",
            price: "Free",
            imageSrc: "/pithos/PithosThumbnail.png",
            is3D: true,
            link: "/",
        },
        {
            title: "Stylized Trees Pack",
            subtitle: "Low Poly Trees",
            rating: 4.5,
            reviews: 210,
            author: "TreeForge",
            price: "$12",
            imageSrc: "/pithos/PithosThumbnail.png",
            is3D: true,
            link: "/",
        },
        {
            title: "2D UI Icons",
            subtitle: "Modern UI Icon Set",
            rating: 4.8,
            reviews: 1023,
            author: "PixelCraft",
            price: "Free",
            imageSrc: "/pithos/PithosThumbnail.png",
            is3D: false,
            link: "/",
        },
        {
            title: "Fantasy Props",
            subtitle: "Weapons & Items",
            rating: 4.6,
            reviews: 340,
            author: "Mythic Studio",
            price: "$8",
            imageSrc: "/pithos/PithosThumbnail.png",
            is3D: true,
            link: "/",
        },
        {
            title: "Fantasy Props",
            subtitle: "Weapons & Items",
            rating: 4.6,
            reviews: 340,
            author: "Mythic Studio",
            price: "$8",
            imageSrc: "/pithos/PithosThumbnail.png",
            is3D: true,
            link: "/",
        },
    ];

    return (
        <section className="w-full flex flex-col">
            <div className="self-center">

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">
                            Popular Assets
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Trending picks curated for you
                        </p>
                    </div>

                    <button className="text-sm font-medium text-primary hover:underline transition">
                        View all →
                    </button>
                </div>

                {/* Scrollable Row */}
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {assets.map((asset, index) => (
                        <div
                            key={index}
                            className="min-w-[240px] max-w-[260px] flex-shrink-0"
                        >
                            <ProductCard {...asset} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}