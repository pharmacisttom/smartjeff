/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_DEMO_MODE: process.env.DEMO_MODE || 'false',
  },
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: { remotePatterns: [] },
};

module.exports = nextConfig;
