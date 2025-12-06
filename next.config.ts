import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

console.log("Build-time debug: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is " + (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "SET" : "NOT SET"));


export default nextConfig;
