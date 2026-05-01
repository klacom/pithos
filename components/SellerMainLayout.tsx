import { ReactNode } from "react";
import SideBar from "./SideBar";
import { Home, PackagePlus, Notebook, Settings } from "lucide-react";
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
    ];

    const settingLink = {
        href: "/seller/account",
        label: "Settings",
        icon: <Settings size={iconSize} />,
    };

    return (
        <main className="flex w-full h-full min-h-0 overflow-hidden">
            <SideBar links={links} settingLink={settingLink} createAudit={createAudit} />

            <section className="flex-1 min-w-0 h-full overflow-y-auto">
                {children}
            </section>
        </main>
    );
};

export default SellerMainLayout;