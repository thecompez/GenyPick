import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "genyleap.com" },
      { protocol: "https", hostname: "imagedelivery.net" },
      { protocol: "https", hostname: "i.imgur.com" }
    ]
  },
  typedRoutes: true
};

export default nextConfig;
