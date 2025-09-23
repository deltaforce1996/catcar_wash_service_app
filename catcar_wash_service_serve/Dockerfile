# =============================================================================
# Multi-stage Dockerfile for NestJS Backend Service with Prisma
# =============================================================================
# This Dockerfile uses a multi-stage build approach to create an optimized
# production image with Prisma database migrations and minimal size.

# =============================================================================
# BUILD STAGE - Compile and build the application
# =============================================================================
# Use the official Node.js 20 Alpine image as base for building
# Alpine Linux provides a minimal, secure base image
FROM node:20-alpine AS base

# Install pnpm package manager globally
# pnpm is faster and more efficient than npm for dependency management
RUN npm install -g pnpm

# Set the working directory inside the container
# All subsequent commands will be executed from this directory
WORKDIR /app

# Copy package management files first for better Docker layer caching
# This allows Docker to cache the dependency installation layer
# and only rebuild when package files change
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev dependencies needed for building)
# --frozen-lockfile ensures exact versions from lockfile are used
RUN pnpm install --frozen-lockfile

# Copy Prisma schema and migration files
# These are needed for database operations
COPY prisma ./prisma

# Copy source code
COPY . .

# Generate Prisma client
# This creates the Prisma client based on the schema
RUN pnpm prisma generate

# Build the NestJS application for production
# This creates optimized, compiled JavaScript in the dist directory
RUN pnpm run build

# =============================================================================
# PRODUCTION STAGE - Create optimized runtime image
# =============================================================================
# Start with a fresh Alpine image for the production stage
# This ensures no build tools or dev dependencies are included
FROM node:20-alpine AS production

# Install pnpm globally in the production image
# Required to manage the production dependencies
RUN npm install -g pnpm

# Set the working directory for the production stage
WORKDIR /app

# Copy package files to install production dependencies
COPY package.json pnpm-lock.yaml ./

# Install production dependencies plus ts-node for seeding
# ts-node is needed for running the seed script
RUN pnpm install --frozen-lockfile --prod && \
    pnpm add ts-node --save-dev

# Copy Prisma schema and source files needed for seeding
# The schema and all source modules are needed for database operations and seeding
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/src ./src
COPY --from=base /app/tsconfig.json ./tsconfig.json

# Generate Prisma client for production
# This creates the Prisma client needed at runtime
RUN pnpm prisma generate

# Copy the built application from the build stage
# The dist directory contains the compiled NestJS application
COPY --from=base /app/dist ./dist

# Create startup script that runs migrations before starting the app
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Waiting for database to be ready..."' >> /app/start.sh && \
    echo 'sleep 5' >> /app/start.sh && \
    echo 'echo "Running Prisma migrations..."' >> /app/start.sh && \
    echo 'pnpm prisma migrate deploy' >> /app/start.sh && \
    echo 'echo "Resetting Prisma database..."' >> /app/start.sh && \
    echo 'pnpm prisma migrate reset --force' >> /app/start.sh && \
    echo 'echo "Starting NestJS application..."' >> /app/start.sh && \
    echo 'exec node dist/src/main.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
# Create a non-root user group for enhanced security
# Running as root in containers is a security risk
RUN addgroup -g 1001 -S nodejs

# Create a non-root user for running the application
# This user will have limited privileges
RUN adduser -S nestjs -u 1001

# Change ownership of the application directory to the nestjs user
# This ensures the application can read/write to its own files
RUN chown -R nestjs:nodejs /app

# Switch to the non-root user for running the application
USER nestjs

# =============================================================================
# RUNTIME CONFIGURATION
# =============================================================================
# Expose port 3000 to allow external connections
# This is the default port for NestJS applications
EXPOSE 3000

# Set the Node.js environment to production
# This enables production optimizations and disables debug features
ENV NODE_ENV=development

# Start the application with migrations
# This will run Prisma migrations first, then start the NestJS application
CMD ["/app/start.sh"]
