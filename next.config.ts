import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    /* config options here */
    serverExternalPackages: ['@mastra/*', '@statsig/statsig-node-core'],
    output: 'standalone',
};

export default nextConfig;
