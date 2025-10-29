/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Exclude playwright from bundling (only runs server-side)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Prevent webpack from processing files in scraper's node_modules
    // This directory should be ignored entirely
    config.module.rules.push({
      test: /\.js$/,
      include: /src\/lib\/scraper\/node_modules/,
      use: 'ignore-loader',
    });
    
    // Exclude playwright packages from bundling
    // They'll be loaded from node_modules at runtime (server-side only)
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push(/^playwright/, /^playwright-core/, /^electron/);
      } else {
        config.externals = [
          config.externals,
          /^playwright/,
          /^playwright-core/,
          /^electron/,
        ];
      }
    }
    
    return config;
  },
};

module.exports = nextConfig;
