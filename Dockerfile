FROM node:20-bullseye-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --production

COPY . ./

ENV PORT=9500
EXPOSE 9500

CMD ["node", "src/server.js"]
