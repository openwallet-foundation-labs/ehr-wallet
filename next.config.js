/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Enable standalone output for Docker deployments
  output: 'standalone',
  // Turbopack is the default bundler in Next.js 16
  // Empty config silences webpack migration warning
  turbopack: {},
  // Externalize IPFS/Helia modules to avoid native module loading issues
  serverExternalPackages: [
    'helia',
    '@helia/unixfs',
    '@helia/json',
    '@ipshipyard/node-datachannel',
    'ipfs-http-client',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;