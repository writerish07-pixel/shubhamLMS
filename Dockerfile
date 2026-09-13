FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=43147
ENV DATA_DIR=/data

EXPOSE 43147

CMD ["node", "scripts/start.mjs"]
