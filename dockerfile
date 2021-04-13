FROM node:latest
WORKDIR ./app
ADD . .
RUN npm install
RUN npm run node_1	
