FROM node:22-alpine

RUN apk add --no-cache git

WORKDIR /app

RUN addgroup -g 1000 appgroup 2>/dev/null || true && \
    adduser -u 1000 -G appgroup -s /bin/sh -D appuser 2>/dev/null || true

RUN chown -R node:node /app

USER node

EXPOSE 3000 5173

CMD ["sh", "-c", "if [ -f package.json ]; then npm run dev; else tail -f /dev/null; fi"]
