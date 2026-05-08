import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
    // cacheComponents: true,
    images: {
        dangerouslyAllowLocalIP: isDev,
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
    },
    experimental: {
        // Dev/proxy request body ceiling for large multipart uploads.
        proxyClientMaxBodySize: 100 * 1024 * 1024,
        serverActions: {
            // Allow multipart overhead so 50 MB asset uploads do not fail parsing.
            bodySizeLimit: '100mb',
        },
    },
};

export default nextConfig;
