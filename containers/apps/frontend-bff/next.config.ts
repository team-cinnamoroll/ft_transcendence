import type { NextConfig } from 'next';

if (!process.env.NEXT_PUBLIC_BFF_API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_BFF_API_BASE_URL is required');
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
};

export default nextConfig;
