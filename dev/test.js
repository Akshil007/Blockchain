const blockchain = require('./blockchain');

const bitcoin = new blockchain();

bitcoin.chainIsValid(bitcoin.chain);
