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
  experimental: {},  webpack: (config, { isServer }) => {
    // Don't polyfill or mock any modules on the server side
    if (!isServer) {
      // Handle WebSocket dependencies and Node.js built-ins
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        path: false,
        crypto: false,
        buffer: require.resolve('buffer/'),
        stream: require.resolve('stream-browserify'),
        bufferutil: require.resolve('./lib/ws-polyfill.js'),
        'utf-8-validate': require.resolve('./lib/ws-polyfill.js'),
        net: false,
        tls: false,
      };
      
      // Add plugin for Buffer polyfill 
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }
    return config;
  },
};

export default nextConfig;
