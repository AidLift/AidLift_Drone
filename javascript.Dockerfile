# Monolith
FROM node:18 AS frontend

WORKDIR /app/client
COPY client/ ./
RUN npm install && npm run build

FROM node:18 AS backend

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY server/ ./server

COPY --from=frontend /app/client/dist ./server/public

EXPOSE 3000

CMD ["node", "server/api.js"]
