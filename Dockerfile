FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
