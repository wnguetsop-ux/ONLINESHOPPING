/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { 
    domains: ['firebasestorage.googleapis.com'], 
    unoptimized: true 
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/superadmin', destination: '/superadmin' },
        { source: '/superadmin/:path*', destination: '/superadmin/:path*' },
      ]
    };
  },
};
module.exports = nextConfig;