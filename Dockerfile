
# Stage 1: Build Stage
FROM node:current-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy the rest of your application's source code
COPY ./src ./src

# Build the application
RUN npm run build

# Stage 2: Production Stage
FROM node:current-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy the built application from the build stage
COPY --from=build /app/dist ./dist

# Copy the initialization script
COPY ./src/init-db.ts ./dist/init-db.js

# Expose the necessary port
EXPOSE 3000

# Start the application
CMD ["sh", "-c", "bun dist/init-db.js && node dist/server.js"]