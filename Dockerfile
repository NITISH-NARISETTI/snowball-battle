# Inside snowball-battle/Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

COPY server/ ./server

WORKDIR /app/server

RUN npm install
RUN chmod +x ./node_modules/.bin/pkgroll
RUN npm run build

FROM node:20-alpine

WORKDIR /app/server

COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package*.json ./

RUN npm install --omit=dev

CMD ["node", "dist/index.js"]
