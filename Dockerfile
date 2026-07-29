# syntax=docker/dockerfile:1

FROM node:24-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

FROM node:24-alpine AS backend-dependencies
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
ENV SERVE_FRONTEND=true
WORKDIR /app

COPY --chown=node:node backend ./backend
COPY --chown=node:node --from=backend-dependencies /app/backend/node_modules ./backend/node_modules
COPY --chown=node:node --from=frontend-build /app/frontend/dist ./frontend/dist

USER node
EXPOSE 3001
CMD ["node", "backend/server.js"]
