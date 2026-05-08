import { ThemeSwitcher } from "../../theme-switcher";
import ShoppingCartBtn from "./ShoppingCartBtn";
import SwitchToDBorHomeBtn from "./SwitchToDBorHomeBtn";
import { AuthButton } from "./AuthButton";

export function NavbarActions({
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