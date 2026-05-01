import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    cacheComponents: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/a/**'
            },
            {
                protocol: "https",
                hostname: "ynbnnvnnfvslbozbtcso.supabase.co",
                pathname: "/storage/v1/object/public/**",
            }
        ],
    }
};

export default nextConfig;
