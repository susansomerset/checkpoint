import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Disable browser console logs only (keep terminal logs)
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable browser console logs
      config.infrastructureLogging = {
        level: 'error',
      };
    }
    return config;
  },
};

export default nextConfig;
