# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund

# Copy source code
COPY src ./src
COPY prisma ./prisma

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S meetyourdog -u 1001

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder --chown=meetyourdog:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=meetyourdog:nodejs /app/dist ./dist
COPY --from=builder --chown=meetyourdog:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p logs && chown meetyourdog:nodejs logs

# Switch to non-root user
USER meetyourdog

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { \
    if (res.statusCode !== 200) process.exit(1); \
    res.on('data', () => {}); res.on('end', () => process.exit(0)); \
  }).on('error', () => process.exit(1))"

CMD ["npm", "start"]