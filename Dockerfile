# syntax=docker/dockerfile:1.5
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Enable caching for npm dependencies
RUN --mount=type=cache,target=/root/.npm mkdir -p /root/.npm

# Install dependencies
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --quiet

# Copy source code
COPY . .

# Build the Next.js app
RUN --mount=type=cache,target=/root/.npm \
    npm run build

# Runtime stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
