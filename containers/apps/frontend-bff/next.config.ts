import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

if (!process.env.NEXT_PUBLIC_BFF_API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_BFF_API_BASE_URL is required');
}

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      // backendのFileSizeSchemaの上限(10MB)に合わせる。デフォルトは1MBのため画像アップロードで不足する
      bodySizeLimit: '10mb',
    },
  },
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

export default withNextIntl(nextConfig);
