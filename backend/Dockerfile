FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including dev) for build
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

### Runtime image
FROM node:20-alpine AS runner

# Install FFmpeg and postgres client in runtime for media processing and health checks
RUN apk add --no-cache ffmpeg postgresql-client

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built output from builder
COPY --from=builder /app/dist ./dist

# Create uploads dir for mounting
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 3000

# Wait for Postgres to be ready, run migrations (if any) then start the app
CMD ["sh", "-c", "until pg_isready -h ${DB_HOST:-postgres} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres}; do echo waiting for postgres...; sleep 1; done; npm run migration:run || true; npm run start:prod"]
