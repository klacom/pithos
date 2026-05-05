"use client";

import { useState, useMemo, Suspense } from "react";
import { usePathname } from "next/navigation";

import NavSearchBar from "./NavSearchBar";
import BurgerBtn from "./BurgerBtn";
import Link from "next/link";
import PithosLogo from "./PithosLogo";
import { ThemeSwitcher } from "./theme-switcher";
import ShoppingCartBtn from "./ShoppingCartBtn";
import SwitchToDBorHomeBtn from "./SwitchToDBorHomeBtn";
import { AuthButton } from "./AuthButton";

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
    }, [role, pathname]);

    return (
        <>
            {/* Desktop */}
            <nav className="hidden lg:flex w-full justify-center border-b h-16">
                <div className="w-full flex justify-between items-center px-5">

                    <NavbarLogo />

                    {config.showSearch && <NavSearchBar />}

                    <NavbarActions
                        showCart={true}
                        dbLink={config.dbLink}
                        role={role}
                    />
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

function NavbarLogo() {
    return (
        <Link href="/" className="flex items-center gap-2 font-bold uppercase">
            <PithosLogo size={24} color="foreground" />
            Pithos
        </Link>
    );
}

function NavbarActions({
    showCart,
    dbLink,
    role,
}: any) {
    return (
        <div className="flex gap-2 items-center">
            <ThemeSwitcher />
            {showCart && <ShoppingCartBtn />}

            {dbLink && (
                <SwitchToDBorHomeBtn
                    role={role}
                    DBLink={dbLink}
                    homePageLink="/"
                />
            )}

            <AuthButton role={role} />
        </div>
    );
}

function MobileNavbar({
    open,
    setOpen,
    config,
    role,
}: any) {
    const AuthButton = config.AuthButton;

    return (
        <div
            className={`
                lg:hidden fixed top-0 right-0 h-full w-full z-20
                flex flex-col items-center justify-center gap-16
                transition-transform duration-300 ease-in-out
                bg-[#0f0f0f90] backdrop-blur-3xl
                ${open ? "translate-x-0" : "translate-x-full"}
            `}
        >
            {/* Logo */}
            <NavbarLogo />

            {/* Search */}
            {config.showSearch && <NavSearchBar />}

            {/* Actions */}
            <div className="flex flex-col gap-4 items-center">
                <NavbarActions
                    showCart={true}
                    dbLink={config.dbLink}
                    role={role}
                    AuthButton={AuthButton}
                />
            </div>
        </div>
    );
}