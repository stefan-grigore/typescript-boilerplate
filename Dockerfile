# syntax=docker/dockerfile:1

### 1) Install deps (with dev deps for TypeScript build)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

### 2) Build TypeScript to dist/
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY src ./src
# compile TS using local typescript (dev dep)
RUN npx tsc -p tsconfig.json

### 3) Runtime image (prod deps only)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# only install production deps
COPY package*.json ./
RUN npm ci --omit=dev

# bring compiled JS
COPY --from=builder /app/dist ./dist

# drop privileges
USER node

# default port (can override at run time)
ENV PORT=3000
EXPOSE 3000

# start the compiled app
CMD ["node", "dist/index.js"]
