"use client";

import { useState, useMemo, Suspense } from "react";
import { usePathname } from "next/navigation";

import NavSearchBar from "./NavSearchBar";
import BurgerBtn from "./BurgerBtn";
import { NavbarActions } from "./NavbarActions";
import { MobileNavbar } from "./MobileNavbar";
import { NavbarLogo } from "./NavbarLogo";
import ShoppingCartBtn from "./ShoppingCartBtn";

type roleProps = {
    role: "buyer" | "seller" | "admin" | null;
};

export default function NavBar({ role }: roleProps) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const config = useMemo(() => {
        switch (role) {
            case "seller":
                return {
                    showSearch: true,
                    dbLink: "/seller/seller-dashboard",
                };
            case "admin":
                return {
                    showSearch: true,
                    dbLink: "/admin/admin-dashboard",
                };
            default:
                return {
                    showSearch: true,
                    dbLink: null,
                };
        }
    }, [role]);

    return (
        <>
            {/* Desktop */}
            <nav className="hidden lg:flex w-full justify-center border-b h-16 bg-primary-foreground sticky top-0 z-50">
                <div className="w-full flex justify-between items-center px-5">

                    <NavbarLogo />

                    <Suspense fallback={<div className="w-full max-w-md h-10 bg-muted animate-pulse rounded-full" />}>
                        {config.showSearch && <NavSearchBar />}
                    </Suspense>

                    <NavbarActions showCart dbLink={config.dbLink} role={role} />
                </div>
            </nav>

            {/* Mobile Header */}
            <nav className="lg:hidden flex w-full justify-between items-center px-4 border-b h-14 bg-primary-foreground sticky top-0 z-50">
                <NavbarLogo />
                
                <div className="flex items-center gap-2">
                    {/* Minimal actions on mobile header to avoid crowding */}
                    {(role === "buyer" || role === null) && (
                        <ShoppingCartBtn />
                    )}
                    <BurgerBtn open={open} setOpen={setOpen} isHeader />
                </div>
            </nav>

            {/* Mobile navbar */}
            <MobileNavbar
                open={open}
                setOpen={setOpen}
                config={config}
                role={role}
            />
        </>
    );
}