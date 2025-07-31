import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // allows all domains (Next.js 13.4+)
      },
    ],
  },
};

export default nextConfig;
