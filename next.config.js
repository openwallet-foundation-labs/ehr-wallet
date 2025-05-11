/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable in development to prevent multiple GenerateSW calls
  buildExcludes: [/middleware-manifest.json$/] // Exclude middleware manifest
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lovable.dev'],
  },
  // Disable ESLint during build to prevent configuration issues
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = withPWA(nextConfig);
