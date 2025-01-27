import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  transpilePackages: ["@ant-design/icons", "@ant-design/icons-svg", "rc-util"],
  experimental: {
    esmExternals: "loose",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
