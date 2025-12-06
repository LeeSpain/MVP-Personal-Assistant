/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Also ignore TS errors during build if needed, but let's try just eslint first
        // ignoreBuildErrors: true, 
    },
};

export default nextConfig;
