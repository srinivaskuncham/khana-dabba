# Use Node.js LTS version
FROM node:20-slim

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

# Start the application
CMD [ "npm", "start" ]