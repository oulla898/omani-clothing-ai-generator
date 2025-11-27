import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable serving static files from public directory
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
    ]
  },
  // Static export for better SEO
  output: 'export',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Trailing slash for consistent URLs
  trailingSlash: true,
}

export default nextConfig;
