FROM node:latest
WORKDIR ./app
ADD . .
RUN npm install
CMD npm run node_1	
