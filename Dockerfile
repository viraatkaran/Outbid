FROM node:22-bookworm-slim

# Build tools are only a fallback in case better-sqlite3 has no prebuilt binary
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are baked in at build time; Railway passes matching variables as build args
ARG NEXT_PUBLIC_BRAND_NAME
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_BRAND_NAME=$NEXT_PUBLIC_BRAND_NAME \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
# Run Next directly (not through npm) so the stop signal on redeploy ends the old container cleanly instead of being reported as a crash
CMD ["node", "node_modules/next/dist/bin/next", "start"]
