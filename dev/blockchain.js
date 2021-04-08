//sha 256 for hashing
const sha256=require('sha256'); 
const {v4 : uuidv4} = require('uuid');
const currNodeUrl = process.argv[3];

function blockchain()
{
	this.chain=[];
	this.pendingTransactions=[];
	
	this.currNodeUrl=currNodeUrl;
	this.networkNodes = [];

	//first block of blockchain is known as genesis block. it does not have previous hash
	//and thats why does not have its own hash
	this.createNewBlock(100,'0','0');
}

blockchain.prototype.createNewBlock=function(nonce, previosBlockHash, Hash){

	const newBlock={
		index : this.chain.length+1,
		timeStamp : Date.now(),
		tansactions : this.pendingTransactions,
		nonce : nonce,
		hash : Hash,
		previosBlockHash : previosBlockHash,

	};

	this.pendingTransactions = [];
	this.chain.push(newBlock);

	return newBlock;
}

blockchain.prototype.getLastBlock=function(){
	return this.chain[this.chain.length-1];
}

blockchain.prototype.createNewTransaction =function(amount,sender,recipient)
{
	const newTransaction = {
		amount : amount,
		sender : sender,
		recipient : recipient,
		transactionId : uuidv4().split("-").join("")
	}

	return newTransaction;
}


blockchain.prototype.addTransactionToPendingTransaction = function(transactionObj)
{
	this.pendingTransactions.push(transactionObj);
	return this.getLastBlock()['index']+1;
}


blockchain.prototype.hashBlock = function(previousBlockHash, currBlockData ,nonce)
{
	const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currBlockData);
	const hash = sha256(dataAsString);
	return hash;
}


blockchain.prototype.proofOfWork = function(previousBlockHash, currBlockData)
{
	/* This method will do a work till it gets first 4 character as 0000.
	*/
	let nonce = 0;
	let hash = this.hashBlock(previousBlockHash, currBlockData, nonce);
	while(hash.substring(0,4) !== '0000')
	{
		nonce++;
		hash = this.hashBlock(previousBlockHash, currBlockData, nonce);
		//console.log(hash);
	}

	return nonce;
}

module.exports = blockchain;