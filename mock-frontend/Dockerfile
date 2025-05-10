FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install Python and other build dependencies
RUN apk add --no-cache python3 make g++ gcc libc-dev linux-headers eudev-dev udev

# Set Python path for node-gyp
ENV NPM_CONFIG_PYTHON=/usr/bin/python3

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Expose the port Vite runs on
EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev", "--", "--host"]
