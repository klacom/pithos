"use client";

import { CircleGauge, Store } from "lucide-react";
import Link from "next/link";
import { Button } from "../../ui/button";
import { usePathname } from "next/navigation";
import { isCurrentRouteRBACProtected } from "@/lib/supabase/site_routes";

type Props = {
    role: string;
    DBLink: string;
    homePageLink: string;
};

const SwitchToDBorHomeBtn = ({ role, DBLink, homePageLink }: Props) => {
    const pathname = usePathname();

    // Check if we are in restricted routes (seller or admin specific)
    const isRestricted = pathname.startsWith('/seller') || pathname.startsWith('/admin');

    const href = isRestricted ? homePageLink : DBLink;

    return (
        <Button asChild variant="ghost" size="sm">
            <Link href={href} className="flex items-center gap-2">
                {isRestricted ? (
                    <>
                        <Store size={16} />
                        Go to Public
                    </>
                ) : (
                    <>
                        <CircleGauge size={16} />
                        Go to Restricted Area
                    </>
                )}
            </Link>
        </Button>
    );
};

export default SwitchToDBorHomeBtn;