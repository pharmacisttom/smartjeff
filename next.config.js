/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_DEMO_MODE: process.env.DEMO_MODE || 'false',
    NEXT_PUBLIC_DEMO_SHOW_PASSWORD_HINT: process.env.DEMO_SHOW_PASSWORD_HINT === 'true' ? 'true' : 'false',
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
