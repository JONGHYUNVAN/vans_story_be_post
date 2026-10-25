FROM node:26-alpine AS base
WORKDIR /app
COPY package*.json ./

# ── development ──────────────────────────────────────────────────────────────
FROM base AS development
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

# ── builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# ── production ────────────────────────────────────────────────────────────────
FROM node:26-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main"]
