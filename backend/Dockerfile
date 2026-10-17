# ===================================================
# Stage 1: Build & Dependencies
# ===================================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# ===================================================
# Stage 2: Production Runner
# ===================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8000

# Run as non-root user for security
USER node

# Copy production node_modules and application code
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src/ ./src/
COPY --chown=node:node scripts/ ./scripts/

# Expose backend API & WebSocket port
EXPOSE 8000

# Start production server
CMD ["node", "src/server.js"]
