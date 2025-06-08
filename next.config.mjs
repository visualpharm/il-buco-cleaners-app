import path from 'path';

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
  // Webpack configuration for both dev and prod
  webpack: (config, { isServer, dev }) => {
    // Only configure watch options in development
    if (dev) {
      config.watchOptions = {
        poll: 5000,
        aggregateTimeout: 600,
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
      };
    }
    return config;
  },
  // Output file tracing configuration
  experimental: {
    outputFileTracingRoot: process.cwd(),
    outputFileTracingExcludes: {
      '*': [
        'node_modules/**/@swc/core-linux-x64-gnu',
        'node_modules/**/@swc/core-linux-x64-musl',
        'node_modules/**/@esbuild/linux-x64',
      ],
    },
    outputFileTracingIncludes: {
      '/api/**/*': ['./lib/**/*'],
    },
  },
}

export default nextConfig