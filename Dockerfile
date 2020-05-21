FROM node:12

RUN npm install

CMD ["npm", "start"]