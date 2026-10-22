# Backend image only. The React bundle is deployed separately or served by a
# reverse proxy; no database credentials are baked into this image.
# Prisma 5.22's native ARM64 client requires the Debian OpenSSL 3 runtime.
# Alpine selects a musl/OpenSSL 1.1 engine that is unavailable in Node 20 Alpine.
FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend ./
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 5001
CMD ["node", "server_wanderbudget_24BAI0226.js"]
