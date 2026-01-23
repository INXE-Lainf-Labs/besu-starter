# Use alpine node base image
FROM node:18-alpine
# Set working directory inside the docker node
WORKDIR /scripts
# Copy package files and install dependencies
COPY package*.json ./
RUN npm install
# Copy the rest of the application code
COPY . .
# Expose the application port
EXPOSE 3000
# Command to run node.js in a docker container
CMD ["node", "server.js"]


# -------- Stage 1: Build dependencies --------
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /scripts

# Copy only package files to leverage Docker cache
COPY package*.json ./

# Copy application source
COPY . .

# -------- Stage 2: Runtime image --------
FROM node:18-alpine

# Set working directory
WORKDIR /scripts

# Copy only the built app and node_modules from builder
COPY --from=builder /scripts /scripts

# Expose application port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]