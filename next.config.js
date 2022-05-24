/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: 'build',
  env: {
    appName: 'gitstore-app',
    Version: '1.0.0'
  }
}

module.exports = nextConfig
