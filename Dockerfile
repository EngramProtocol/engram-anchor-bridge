FROM alpine:latest

RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY anchor-bot/ ./anchor-bot/
RUN cd anchor-bot && npm install
RUN mkdir -p /app/anchor-bot/logs