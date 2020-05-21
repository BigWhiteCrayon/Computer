# Fetch node_modules for backend, nothing here except 
# the node_modules dir ends up in the final image
FROM node:12 as builder
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json /app/package.json
RUN npm install

# Add the files to arm image
FROM arm32v6/node:12-alpine
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

# Same as earlier, be specific or copy everything
ADD package.json /app/package.json
ADD package-lock.json /app/package-lock.json
ADD . /app

RUN npm install ffmpeg-static

COPY --from=builder /app/node_modules /app/node_modules

ENV PORT=5000
EXPOSE 5000
CMD [ "npm", "start" ]