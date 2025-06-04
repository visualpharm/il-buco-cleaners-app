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
  // Enable hot reloading in Docker
  webpackDevMiddleware: config => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },
  // Ensure the app binds to all interfaces
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./lib/**/*'],
    },
  },
}

export default nextConfig