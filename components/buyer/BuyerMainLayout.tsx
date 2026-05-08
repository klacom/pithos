import { ReactNode } from "react"
import SideBar from "../main-components/sidebar/SideBar";
import { User, Shield, ShoppingBag, Heart } from "lucide-react";
import { createAudit } from "@/lib/supabase/create-audit";

type LinkItem = {
    href: string;
    label: string;
    icon: React.ReactNode;
};

const BuyerMainLayout = ({ children }: { children: ReactNode }) => {
    const iconSize = 18;
    const links: LinkItem[] = [
        {
            href: '/buyer/account/personal-info',
            label: 'Personal Info',
            icon: <User size={iconSize} />,
        },
        {
            href: '/buyer/account/security',
            label: 'Security',
            icon: <Shield size={iconSize} />,
        },
        {
            href: '/buyer/account/purchase-history',
            label: 'Purchase History',
            icon: <ShoppingBag size={iconSize} />,
        },
        {
            href: '/buyer/favorites',
            label: 'Liked Products',
            icon: <Heart size={iconSize} />,
        },
    ];

    return (
        <main className='flex w-full h-full min-h-0 overflow-hidden'>
            <SideBar links={links} createAudit={createAudit} />
            <section className="flex-1 min-w-0 h-full overflow-y-auto">
                {children}
            </section>
        </main>
    )
}

export default BuyerMainLayout
