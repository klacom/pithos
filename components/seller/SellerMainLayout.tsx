import { ReactNode } from "react";
import SideBar from "../main-components/sidebar/SideBar";
import { Home, PackagePlus, Notebook, WalletCards } from "lucide-react";
import { createAudit } from "@/lib/supabase/create-audit";

const SellerMainLayout = ({ children }: { children: ReactNode }) => {
    const iconSize = 18;

    const links = [
        {
            href: "/seller/seller-dashboard",
            label: "Dashboard",
            icon: <Home size={iconSize} />,
        },
        {
            href: "/seller/assets",
            label: "Assets",
            icon: <PackagePlus size={iconSize} />,
        },
        {
            href: "/seller/orders",
            label: "Orders",
            icon: <Notebook size={iconSize} />,
        },
        {
            href: "/seller/payout-settings",
            label: "Payout Settings",
            icon: <WalletCards size={iconSize} />,
        },
    ];

    return (
        <main className="flex w-full h-full min-h-0 overflow-hidden">
            <SideBar links={links} createAudit={createAudit} />

            <section className="flex-1 min-w-0 h-full overflow-y-auto">
                {children}
            </section>
        </main>
    );
};

export default SellerMainLayout;