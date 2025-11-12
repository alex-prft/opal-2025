# OSA Platform - Multi-stage Docker Build
# Optimized for production deployment with security and performance

# ============================================================================
# Build Stage
# ============================================================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    curl

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build application
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============================================================================
# Production Stage
# ============================================================================
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 osa && \
    adduser --system --uid 1001 osa

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    tzdata

# Set timezone
ENV TZ=UTC

# Copy built application from builder stage
COPY --from=builder --chown=osa:osa /app/next.config.js ./
COPY --from=builder --chown=osa:osa /app/public ./public
COPY --from=builder --chown=osa:osa /app/.next/standalone ./
COPY --from=builder --chown=osa:osa /app/.next/static ./.next/static

# Copy additional runtime files
COPY --from=builder --chown=osa:osa /app/package.json ./
COPY --from=builder --chown=osa:osa /app/database ./database

# Create logs directory
RUN mkdir -p /app/logs && chown osa:osa /app/logs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER osa

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]

# ============================================================================
# Development Stage
# ============================================================================
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Install dependencies for development
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

# ============================================================================
# Testing Stage
# ============================================================================
FROM node:18-alpine AS testing

# Set working directory
WORKDIR /app

# Install dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to skip installing Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=test
ENV CI=true

# Run tests
CMD ["npm", "run", "test:ci"]

# ============================================================================
# Build Arguments and Labels
# ============================================================================
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL maintainer="OSA Platform Team <osa-platform@company.com>" \
      org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="OSA Platform" \
      org.label-schema.description="Optimizely Strategy Assistant Platform" \
      org.label-schema.url="https://osa.company.com" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vcs-url="https://github.com/company/osa-platform" \
      org.label-schema.vendor="Company Name" \
      org.label-schema.version=$VERSION \
      org.label-schema.schema-version="1.0"