FROM node:20-alpine

WORKDIR /app

# Copy root workspace configurations and package files
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install workspace dependencies
RUN npm ci

# Copy source code files for workspaces
COPY shared ./shared
COPY backend ./backend

# Build backend
RUN npm run build:backend

EXPOSE 3000

# Start backend using workspace runner
CMD ["npm", "run", "start", "-w", "backend"]