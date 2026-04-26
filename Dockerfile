# ── Stage 1: Build frontend ───────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Only install production deps
COPY package.json ./
RUN npm install --omit=dev

# Copy server
COPY server/ ./server/

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Data volumes
RUN mkdir -p /data/uploads

ENV NODE_ENV=production
ENV PORT=4000
ENV DATA_DIR=/data
ENV UPLOADS_DIR=/data/uploads

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/ || exit 1

CMD ["node", "server/index.js"]
