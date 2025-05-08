# Use Node.js LTS version as base image
FROM node:18-slim

# Set working directory
WORKDIR /usr/src/app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create a .env file from example if it doesn't exist
RUN cp -n .env.example .env 2>/dev/null || true

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]