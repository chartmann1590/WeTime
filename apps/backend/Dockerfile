FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm, OpenSSL for Prisma, and build tools for native modules
RUN apk add --no-cache openssl openssl-dev python3 make g++ && \
    npm install -g pnpm

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages ./packages

# Install dependencies
RUN pnpm install

# Rebuild native modules for Alpine Linux
# Use npm directly to rebuild bcrypt in the pnpm store location
RUN find node_modules -name "bcrypt" -type d -exec sh -c 'cd "$1" && npm rebuild 2>/dev/null || true' _ {} \;

# Copy app files
COPY apps/backend ./apps/backend

# Copy tsconfig to match package extends path
COPY tsconfig.base.json ./tsconfig.base.json

# Copy prisma schema
COPY prisma ./prisma

# Generate prisma client from root (Prisma 6.x generates to node_modules/.prisma/client)
RUN pnpm exec prisma generate

# Build the app
RUN pnpm --filter backend run build

FROM node:18-alpine AS runner

WORKDIR /app

# Install pnpm and OpenSSL for Prisma (no build tools needed in runner)
RUN apk add --no-cache openssl openssl-dev && \
    npm install -g pnpm

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/packages ./packages

# Copy built app
COPY --from=builder /app/apps/backend/.next ./apps/backend/.next

# Copy prisma schema and server script
COPY prisma ./prisma
COPY apps/backend/server.js ./apps/backend/server.js
COPY apps/backend/src/scripts ./apps/backend/src/scripts

# Set working directory to backend app
WORKDIR /app/apps/backend

# Start the app
CMD ["pnpm", "start"]
