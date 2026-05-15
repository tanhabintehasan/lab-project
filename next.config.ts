import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  // ADD THIS HEADERS SECTION TO FIX THE CSP ERROR
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "style-src 'self' 'unsafe-inline' https://www.gstatic.com https://fonts.googleapis.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com https://translate.googleapis.com;",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/en', destination: '/zh-CN', permanent: true },
      { source: '/en/:path*', destination: '/zh-CN/:path*', permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);