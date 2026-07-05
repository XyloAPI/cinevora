# Docker image for Cinevora backend proxy
# Uses the official Node 20 Alpine base image for a small footprint

FROM node:20-alpine AS base
WORKDIR /app

# Install production + dev dependencies (ts-node needed at runtime)
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build step (optional – we run TS directly via tsx)
# If you prefer a compiled version, uncomment the next line:
# RUN npm run build

# Expose the port the server listens on (default 3001)
EXPOSE 3001

# Default command – runs the Express proxy using tsx
CMD ["npm", "run", "server"]
