# Backend Docker Image (Production)

FROM node:18-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3030

CMD ["node", "index.js"]
