/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // output: "standalone", // disable this to avoid symlink errors
  reactStrictMode: true,
  experimental: {},
};

export default nextConfig;
