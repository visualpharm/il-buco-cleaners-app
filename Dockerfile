FROM node:18.18-alpine3.18

# Set working directory
WORKDIR /app

# Enable pnpm
ENV PNPM_HOME=/usr/local/bin
ENV PATH=$PNPM_HOME:$PATH

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only package files first for better caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with frozen lockfile for reproducible builds
# Using --no-frozen-lockfile temporarily to work around the @radix-ui/react-sheet issue
RUN pnpm install --prefer-offline --no-frozen-lockfile

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 3000

# Production command (use dev for development in docker-compose)
CMD ["pnpm", "run", "start"]
