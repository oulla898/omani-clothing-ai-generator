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
  // Optimize for serverless deployment
  output: 'standalone',
}

export default nextConfig;
