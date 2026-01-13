FROM node:22-alpine

RUN apk add --no-cache git

WORKDIR /app

EXPOSE 3000 5173

CMD ["sh", "-c", "if [ -f package.json ]; then npm run dev; else tail -f /dev/null; fi"]
