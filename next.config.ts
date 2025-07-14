import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    /* config options here */
    serverExternalPackages: ['@mastra/*'],
    output: 'standalone',
};

export default nextConfig;
