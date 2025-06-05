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
  // Enable hot reloading in Docker with optimized polling
  webpackDevMiddleware: config => {
    config.watchOptions = {
      poll: 5000, // Increased from 1000ms to 5000ms to reduce CPU usage
      aggregateTimeout: 600, // Increased from 300ms to 600ms to batch changes better
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        '**/uploads/**',
        '**/build/**',
        '**/out/**',
        '**/.env*',
        '**/.vercel/**',
        '**/mongo_data/**',
        '**/*.log',
        '**/.pnpm-debug.log*',
        '**/npm-debug.log*',
        '**/yarn-debug.log*',
        '**/yarn-error.log*',
        '**/*.tsbuildinfo',
        '**/next-env.d.ts',
        '**/claude_desktop.json',
        '**/docker-compose.yml',
        '**/Dockerfile',
        '**/nginx.conf',
        '**/README*.md',
        '**/CLICK_TRACKING.md',
        '**/UPLOAD_TROUBLESHOOTING.md',
        '**/package-lock.json',
        '**/pnpm-lock.yaml'
      ]
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