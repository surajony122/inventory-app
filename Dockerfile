FROM node:20-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Install all dependencies including devDependencies for the build step
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the code and build
COPY . .
RUN npm run build

# Command to start the app
CMD ["npm", "run", "docker-start"]
