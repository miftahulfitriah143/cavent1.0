import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mengizinkan Next.js HMR jika diakses lewat HP via Wi-Fi lokal
  allowedDevOrigins: ['192.168.100.6', '192.168.82.112', 'localhost'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
