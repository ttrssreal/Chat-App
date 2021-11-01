FROM node:latest

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm i

COPY . .

EXPOSE 9999

CMD ["node", "app.js"]

