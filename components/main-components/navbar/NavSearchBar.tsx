"use client";

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "@deemlol/next-icons";
import { Button } from "../../ui/button";

import { Search as SearchIcon, Loader2 } from "lucide-react";

const NavSearchBar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const sp = useSearchParams();
    const [searchContent, setSearchContent] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentParamsString = useMemo(() => sp?.toString() ?? "", [sp]);

    // keep input in sync when navigating back/forward
    useEffect(() => {
        const q = sp?.get("q") ?? "";
        setSearchContent(q);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentParamsString]);

    const pushWithQuery = (qRaw: string) => {
        setIsSearching(true);
        const q = qRaw.trim();
        const onListing = (pathname ?? "") === "/product-listing";
        const params = new URLSearchParams(onListing ? sp?.toString() : "");
        if (!q) params.delete("q");
        else params.set("q", q);

        const qs = params.toString();
        const base = "/product-listing";
        const target = `${base}${qs ? `?${qs}` : ""}`;
        router.push(target);

        // Reset searching state after a short delay or when pathname changes
        setTimeout(() => setIsSearching(false), 500);
    };

    const runSearch = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        pushWithQuery(searchContent);
    };

    // live search (debounced)
    useEffect(() => {
        // Only auto-navigate while typing when we're already on product listing.
        if ((pathname ?? "") !== "/product-listing") return;

        if (timerRef.current) clearTimeout(timerRef.current);

        const currentQ = sp?.get("q") ?? "";
        if (currentQ.trim() === searchContent.trim()) {
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        timerRef.current = setTimeout(() => {
            pushWithQuery(searchContent);
        }, 500);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchContent, pathname, currentParamsString]);

    return (
        <div className="relative group w-full lg:w-[480px]">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                {isSearching ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : (
                    <SearchIcon className="h-4 w-4 text-primary group-focus-within:text-primary transition-colors" />
                )}
            </div>
            <input
                placeholder="Search for 3D models, textures, or tools..."
                className="w-full h-10 pl-11 pr-10 rounded-full border border-primary bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                type="text"
                value={searchContent}
                onChange={(e) => setSearchContent(e.currentTarget.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                }}
            />
            {isSearching && (
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <span className="text-[10px] text-muted-foreground animate-pulse">Searching...</span>
                </div>
            )}
        </div>
    )
}

export default NavSearchBar
