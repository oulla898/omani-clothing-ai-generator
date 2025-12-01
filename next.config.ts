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
}

export default nextConfig;
