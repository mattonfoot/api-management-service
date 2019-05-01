FROM node:lts-alpine

copy . /
RUN npm install

EXPOSE 3000:3000

CMD ["npm", "start"]
