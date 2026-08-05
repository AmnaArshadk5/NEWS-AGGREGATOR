FROM node:20-alpine

# Install build dependencies for native modules (sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

# Clean rebuild of native binaries for Alpine Linux
RUN npm install --production

# Copy application files (excluding Windows node_modules via .dockerignore)
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
