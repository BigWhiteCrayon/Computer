FROM node:12
# Create app directory
WORKDIR /usr/src/app

RUN apt-get update && apt-get -y install python-pyaudio python3-pyaudio sox 
RUN curl "https://bootstrap.pypa.io/get-pip.py" -o "get-pip.py" && python get-pip.py && pip install pyaudio
RUN apt -y install cmake

RUN apt-get -y install libatlas-base-dev make
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

CMD ["npm", "start"]