/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/lotto',
  assetPrefix: '/lotto/',
}

module.exports = nextConfig