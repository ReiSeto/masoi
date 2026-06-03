FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
