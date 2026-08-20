# Stage 1: Install production dependencies
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# Stage 2: Final production image
FROM node:22-alpine

# Update base system packages and remove npm/npx to eliminate vulnerabilities in build-time tools
RUN apk update && apk upgrade --no-cache && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /root/.npm

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
