/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => config, // no custom rules
};

module.exports = nextConfig;
