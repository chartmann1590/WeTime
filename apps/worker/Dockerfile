FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml ./
COPY apps/worker/package.json ./apps/worker/
COPY packages ./packages

# Install dependencies
RUN pnpm install

# Copy app files
COPY apps/worker ./apps/worker

# Copy tsconfig base to match extends path
COPY tsconfig.base.json ./tsconfig.base.json

# Build the app
RUN pnpm --filter worker run build

# Set working directory to worker app
WORKDIR /app/apps/worker

CMD ["pnpm", "start"]
