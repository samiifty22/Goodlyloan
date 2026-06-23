import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Allow server actions to handle large form payloads (file upload metadata)
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
