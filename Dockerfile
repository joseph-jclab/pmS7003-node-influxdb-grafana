FROM node:alpine

RUN apk add --update --no-cache yarn python build-base linux-headers

WORKDIR /app

ADD package.json yarn.lock ./

RUN yarn install

ADD . .

CMD ["node", "index.js"]