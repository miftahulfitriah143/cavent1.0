import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mengizinkan Next.js HMR jika diakses lewat HP via Wi-Fi lokal
  allowedDevOrigins: ['192.168.100.6', 'localhost'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
