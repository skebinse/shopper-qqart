# Stage 1: install dependencies
FROM --platform=linux/amd64 node:18.16.0-alpine3.17 AS base

RUN apk update && apk add bash
RUN apk add g++ make python3 curl
RUN npm install --arch=arm64 --platform=linux --libc=musl sharp

ARG ENV="prod"
ENV ENV=${ENV}
ENV NODE_ENV=production
ENV PYTHONPATH /usr/lib/python/site-packages

WORKDIR /app
COPY package*.json .

RUN npm install --production

# Stage 2: build
FROM --platform=linux/amd64 node:18.16.0-alpine3.17 AS builder

WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY . .

RUN yarn build

# Stage 3: run
FROM base as production

ARG ENV="prod"
ENV ENV=${ENV}
ENV NODE_ENV=production
ENV PYTHONPATH /usr/lib/python/site-packages

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["yarn", "start:${ENV}"]