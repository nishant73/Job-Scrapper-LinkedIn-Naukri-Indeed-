import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"]
  },
  transpilePackages: ["@ag-grid-community/react"]
};

export default nextConfig;
