import { Suspense } from "react";
import { NavbarLogo } from "./NavbarLogo";
import { NavbarActions } from "./NavbarActions";
import NavSearchBar from "./NavSearchBar";

export function MobileNavbar({
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
            <Suspense>
                {config.showSearch && <NavSearchBar />}
            </Suspense>

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