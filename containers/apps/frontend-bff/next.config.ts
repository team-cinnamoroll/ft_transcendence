import type { NextConfig } from 'next'

if (!process.env.NEXT_PUBLIC_BFF_API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_BFF_API_BASE_URL is required')
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
}

export default nextConfig
