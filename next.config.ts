import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "steamcommunity-a.akamaihd.net"
      },
      {
        protocol: "https",
        hostname: "community.cloudflare.steamstatic.com"
      },
      {
        protocol: "https",
        hostname: "avatars.steamstatic.com"
      }
    ]
  }
};

export default nextConfig;
