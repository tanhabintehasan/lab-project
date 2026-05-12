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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      // Redirect old English URLs directly to zh-CN (single hop — no loop)
      { source: '/en', destination: '/zh-CN', permanent: true },
      { source: '/en/:path*', destination: '/zh-CN/:path*', permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);