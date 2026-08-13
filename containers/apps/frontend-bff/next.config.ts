import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

if (!process.env.NEXT_PUBLIC_BFF_API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_BFF_API_BASE_URL is required');
}
if (!process.env.APP_API_BASE_URL) {
  throw new Error('APP_API_BASE_URL is required');
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
    proxyClientMaxBodySize: '10mb', // standaloneビルド時の内部プロキシの制限も念のため解除
  },
  async rewrites() {
    return [
      {
        // backendがserveStaticで公開しているpublicなファイル(アバター画像など)を、
        // backendのURLをブラウザに公開せずに中継する。
        // ブラウザからは常に自分自身(Next.js)への通信に見える。
        source: '/static/:path*',
        destination: `${process.env.APP_API_BASE_URL}/static/:path*`,
      },
    ];
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
