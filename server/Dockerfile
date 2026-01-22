# Server Dockerfile - Express API Server
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server source code
COPY server.js ./

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Note: The server needs access to:
# 1. .env file (should be mounted as volume or passed as env vars)
# 2. ../blockchain/artifacts (should be mounted as volume)
# 3. Docker socket (for running docker build commands)

# Switch to non-root user
USER nodejs

# Expose the server port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/verify', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the server
CMD ["node", "server.js"]

