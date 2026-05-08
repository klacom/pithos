import { ThemeSwitcher } from "../../theme-switcher";
import ShoppingCartBtn from "./ShoppingCartBtn";
import SwitchToDBorHomeBtn from "./SwitchToDBorHomeBtn";
import { AuthButton } from "./AuthButton";

import { cn } from "@/lib/utils";

export function NavbarActions({
    showCart,
    dbLink,
    role,
    className,
    themeVariant = "dropdown"
}: any) {
    return (
        <div className={cn("flex gap-2 items-center text-foreground", className)}>
            <ThemeSwitcher variant={themeVariant} />
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