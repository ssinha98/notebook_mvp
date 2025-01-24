import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  transpilePackages: ["@ant-design/icons", "@ant-design/icons-svg", "rc-util"],
  experimental: {
    esmExternals: "loose",
  },
};

export default nextConfig;
