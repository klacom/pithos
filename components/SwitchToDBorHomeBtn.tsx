"use client";

import { CircleGauge, Store } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";
import { isCurrentRouteRBACProtected } from "@/lib/supabase/site_routes";

type Props = {
    role: string;
    DBLink: string;
    homePageLink: string;
};

const SwitchToDBorHomeBtn = ({ role, DBLink, homePageLink }: Props) => {
    const pathname = usePathname();

    // derive directly (no state)
    const isProtected = isCurrentRouteRBACProtected(pathname, role);

    const href = isProtected ? homePageLink : DBLink;

    return (
        <Button asChild variant="ghost" size="sm">
            <Link href={href} className="flex items-center gap-2">
                {isProtected ? (
                    <>
                        <Store size={16} />
                        Go to Public
                    </>
                ) : (
                    <>
                        <CircleGauge size={16} />
                        Go to Dashboard
                    </>
                )}
            </Link>
        </Button>
    );
};

export default SwitchToDBorHomeBtn;