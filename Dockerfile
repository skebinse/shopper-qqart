# Stage 1: install dependencies
FROM public.ecr.aws/docker/library/node:18.19.0-alpine3.17 AS base

RUN apk update && apk add bash
RUN apk add g++ make python3 curl
RUN apk add --update --no-cache --repository https://dl-cdn.alpinelinux.org/alpine/v3.19/community --repository https://dl-cdn.alpinelinux.org/alpine/v3.19/main vips-dev

ARG ENV="prod"
ENV ENV=${ENV}
ENV NODE_ENV=production
ENV PYTHONPATH /usr/lib/python/site-packages

WORKDIR /app
COPY package*.json .

RUN npm install --production

# Stage 2: build
FROM public.ecr.aws/docker/library/node:18.19.0-alpine3.17 AS builder

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
CMD ["yarn", "start:dev"]