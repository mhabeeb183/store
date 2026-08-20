FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM nginx:alpine

# Update base system packages and remove unused modules/packages to resolve vulnerabilities (CVEs)
RUN apk update && apk upgrade --no-cache && \
    apk del nginx-module-njs \
            nginx-module-xslt \
            nginx-module-geoip \
            nginx-module-image-filter \
            nginx-module-acme \
            libxslt \
            libxml2 \
            curl \
            libcurl \
            nghttp2-libs \
            --no-cache

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
