// components/HomeBlocks.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { BigBanner } from "@/components/BigBanner";
import { SmallBanner } from "@/components/SmallBanner";
import { ListBanner } from "@/components/ListBanner";
import { HomeCategories } from "@/components/HomeCategories";

export default async function HomeBlocks() {
    const supabase = createAdminClient();

    const { data: blocks, error } = await supabase
        .from("homepage_blocks")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

    if (error) {
        console.error("Error fetching homepage blocks:", error);
    }

    if (!blocks || blocks.length === 0) {
        return (
            <>
                <SmallBanner content={{ items: [] }} />
                <BigBanner content={{
                    label: "New Additions",
                    title: "SPRING SALE",
                    description: "Feed your creativity with 50% off 300+ of our top assets.",
                    cta_text: "SHOP SALE",
                    cta_link: "/product-listing",
                    image_url: "/sample-pics/SinSpire Girl.png"
                }} />
                <HomeCategories />
                <ListBanner content={{
                    title: "Popular Assets",
                    subtitle: "Trending picks curated for you",
                    listType: "views",
                    selectedProductIds: []
                }} />
            </>
        );
    }

    return (
        <>
            {blocks.map((block) => {
                switch (block.type) {
                    case "small_banner":
                        return <SmallBanner key={block.id} content={block.content} />;
                    case "big_banner":
                        return <BigBanner key={block.id} content={block.content} />;
                    case "list_banner":
                        return <ListBanner key={block.id} content={block.content} />;
                    default:
                        return null;
                }
            })}

            {!blocks.some(b => b.type === "list_banner") && <HomeCategories />}
        </>
    );
}