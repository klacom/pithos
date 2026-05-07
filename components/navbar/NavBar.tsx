"use client";

import { useState, useMemo, Suspense } from "react";
import { usePathname } from "next/navigation";

import NavSearchBar from "./NavSearchBar";
import BurgerBtn from "../BurgerBtn";
import { NavbarActions } from "./NavbarActions";
import { MobileNavbar } from "./MobileNavbar";
import { NavbarLogo } from "./NavbarLogo";

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

                    <Suspense>
                        {config.showSearch && <NavSearchBar />}
                    </Suspense>

                    <NavbarActions showCart dbLink={config.dbLink} role={role} />
                </div>
            </nav>

            {/* Mobile trigger */}
            <BurgerBtn open={open} setOpen={setOpen} />

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