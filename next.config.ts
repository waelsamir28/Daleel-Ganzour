import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com",
        pathname: "/hero-transparent.png-4mJs4eQPPhS3OWkWS8SavDv9GDLh0N.jpeg",
      },
    ],
  },
};

export default nextConfig;
