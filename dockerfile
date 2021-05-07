FROM node:alpine
WORKDIR ./app
ADD . .
CMD npm install
CMD npm run node_1	
