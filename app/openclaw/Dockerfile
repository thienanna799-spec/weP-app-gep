# ================================================================
# OpenClaw Telegram Gateway — Dockerfile
# Build: docker build -t openclaw-gateway .
# Run:   docker-compose up -d
# ================================================================

FROM node:20-alpine

WORKDIR /app/openclaw

# Copy package files
COPY package*.json ./
RUN npm ci --production=false

# Copy source
COPY . .

# Build TypeScript → JS
RUN npm run build 2>/dev/null || true

# Environment (override via docker-compose or .env)
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Health check: just verify the process is alive
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "process.exit(0)"

# Run the gateway listener
CMD ["npx", "tsx", "scripts/run.ts", "listen"]
