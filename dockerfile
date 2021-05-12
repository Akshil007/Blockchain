FROM node:latest
WORKDIR ./blockchain
ADD . .
CMD npm install
CMD npm run node_1	
