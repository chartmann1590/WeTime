FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages ./packages

# Install dependencies
RUN pnpm install

# Copy app files
COPY apps/frontend ./apps/frontend

# Copy tsconfig to match package extends path
COPY tsconfig.base.json ./tsconfig.base.json

# Build the app
RUN pnpm --filter frontend run build

FROM node:18-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=builder /app/packages ./packages

# Copy built app
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

# Set working directory to frontend app
WORKDIR /app/apps/frontend

# Start the app
CMD ["pnpm", "start"]
