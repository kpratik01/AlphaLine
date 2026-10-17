# ===================================================
# Stage 1: Build React/Vite Application
# ===================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install dependencies cleanly
RUN npm ci

# Copy full frontend source
COPY . .

# Build arguments for production URLs (defaults to relative paths for Nginx reverse proxy)
ARG VITE_API_URL=/api
ARG VITE_SOCKET_URL=/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Build production assets into /app/dist
RUN npm run build

# ===================================================
# Stage 2: Serve Static Assets with Nginx
# ===================================================
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built distribution from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA fallback & API proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
