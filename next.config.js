/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: 'build',
  env: {
    appName: 'gitstore-app',
    Version: '1.0.0'
  },
  trailingSlash: true,
  exportPathMap: function() {
    return {
      "/": { page: "/" },
    };
  },
  assetPrefix: '.',
  images: { loader: 'custom' },
}

module.exports = nextConfig
