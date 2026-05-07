"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { useAuth } from "../AuthProvider";
import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
    role: "buyer" | "seller" | "admin" | null;
};

export function AuthButton({ role }: Props) {
    const { user, loading } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Important: prevent hydration mismatch
    if (!mounted || loading) {
        return <div className="h-8 w-8" />; // Placeholder with same dimensions as avatar
    }

    const avatar = user?.user_metadata?.avatar_url ?? "";
    const size = 28;

    // const getAccountLink = () => {
    //     switch (role) {
    //         case "seller":
    //             return "/buyer/account";
    //         case "admin":
    //             return "/buyer/account";
    //         default:
    //             return "/buyer/account";
    //     }
    // };

    if (user) {
        return (
            <div className="flex items-center gap-4">
                <Link href="/buyer/account">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer">
                        {avatar ? (
                            <Image
                                src={avatar}
                                width={size}
                                height={size}
                                className="object-cover h-full w-full"
                                alt={user.email ?? "User avatar"}
                            />
                        ) : (
                            <span className="text-xs font-medium">
                                {user.email?.[0]?.toUpperCase() ?? "?"}
                            </span>
                        )}
                    </div>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex gap-2">
            <Button asChild size="sm">
                <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
                <Link href="/auth/sign-up">Sign up</Link>
            </Button>
        </div>
    );
}