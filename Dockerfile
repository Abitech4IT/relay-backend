FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm ci


FROM base AS build

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build


FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

RUN mkdir -p /app/storage

EXPOSE 5000

CMD ["node", "dist/server.js"]