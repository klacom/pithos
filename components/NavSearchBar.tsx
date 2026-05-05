"use client";

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "@deemlol/next-icons";
import { Button } from "./ui/button";

const NavSearchBar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const sp = useSearchParams();
    const [searchContent, setSearchContent] = useState("");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentParamsString = useMemo(() => sp?.toString() ?? "", [sp]);

    // keep input in sync when navigating back/forward
    useEffect(() => {
        const q = sp?.get("q") ?? "";
        setSearchContent(q);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentParamsString]);

    const pushWithQuery = (qRaw: string) => {
        const q = qRaw.trim();
        const onListing = (pathname ?? "") === "/product-listing";
        const params = new URLSearchParams(onListing ? sp?.toString() : "");
        if (!q) params.delete("q");
        else params.set("q", q);

        const qs = params.toString();
        const base = "/product-listing";
        const target = `${base}${qs ? `?${qs}` : ""}`;
        router.push(target);
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
        timerRef.current = setTimeout(() => {
            // Avoid pushing the same query repeatedly.
            const currentQ = sp?.get("q") ?? "";
            if (currentQ.trim() === searchContent.trim()) return;
            pushWithQuery(searchContent);
        }, 350);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchContent, pathname, currentParamsString]);

    return (

    <div className="overflow-hidden rounded-md w-full lg:w-[512px] flex items-center h-full justify-center">
        <input placeholder="Search for an asset" className="rounded-md rounded-r-none text-sm border-muted border-r-0 focus:outline-none h-full w-full px-5 bg-popover text-primary hover:scale-103 focus:border-foreground" type="text" value={searchContent} onChange={(e)=>{setSearchContent(e.currentTarget.value)}} onKeyDown={(e)=>{
            if(e.key === "Enter") runSearch();
        }}/>
        <Button variant={"red_default"} className="rounded-l-none h-full" onClick={runSearch}>
            <Search width={16} height={24}/>
        </Button>

    </div>
  )
}

export default NavSearchBar
