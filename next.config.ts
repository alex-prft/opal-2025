import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? true : false,
  },
  async redirects() {
    return [
      {
        source: '/dev/logs',
        destination: '/engine/admin/logs',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
