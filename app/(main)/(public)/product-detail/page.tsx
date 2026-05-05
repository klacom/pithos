"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Page = () => {
    const router = useRouter();

    useEffect(() => {
        router.replace('/product-listing');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-muted-foreground animate-pulse">Redirecting to product listing...</p>
        </div>
    );
};

export default Page;
