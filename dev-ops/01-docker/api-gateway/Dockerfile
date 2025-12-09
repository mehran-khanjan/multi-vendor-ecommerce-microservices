# Multi-stage build for optimized image size
FROM node:18-alpine AS builder

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ git

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies with clean cache
RUN yarn install --frozen-lockfile --production=false --network-timeout 1000000

# Copy source code
COPY .. .

# Build the application
RUN yarn build

# Remove dev dependencies
RUN rm -rf node_modules && yarn install --frozen-lockfile --production=true --network-timeout 1000000

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache tini curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /usr/src/app

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/package*.json ./

# Copy configuration files
COPY --chown=nodejs:nodejs .env.production ./
COPY --chown=nodejs:nodejs docker-entrypoint.sh ./

# Set permissions
RUN chmod +x docker-entrypoint.sh

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/health/live || exit 1

# Expose port
EXPOSE 4000

# Use tini as init process
ENTRYPOINT ["/sbin/tini", "--"]

# Run the application
CMD ["./docker-entrypoint.sh"]