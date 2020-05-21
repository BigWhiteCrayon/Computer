FROM jrottenberg/ffmpeg:4.0-scratch AS ffmpeg

# Add the files to arm image
FROM arm32v6/node:12-alpine
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm install

COPY --from=ffmpeg / /

CMD [ "npm", "start" ]