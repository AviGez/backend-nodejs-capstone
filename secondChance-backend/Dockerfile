FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 3060

CMD ["node", "app.js"]

