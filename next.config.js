/** @type {import('next').NextConfig} */
const nextConfig = {
  // Rimuoviamo output: 'export' perché usiamo server.url nel capacitor config
  trailingSlash: true, 
  images: {
    unoptimized: true,
    domains: ['firebasestorage.googleapis.com'],
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;