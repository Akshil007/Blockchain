//sha 256 for hashing
const sha256=require('sha256'); 
const {v4 : uuidv4} = require('uuid');

const currNodeUrl = "http://"+process.argv[3]+":3001";

function blockchain()
{
	
	this.chain=[];
	this.pendingRecords=[];
	this.currNodeUrl=currNodeUrl;
	console.log(this.currNodeUrl);
	this.networkNodes = [];



	//first block of blockchain is known as genesis block. it does not have previous hash
	//and thats why does not have its own hash
	this.createNewBlock(100,'0','0');
}

blockchain.prototype.createNewBlock=function(nonce, previousBlockHash, Hash){

	const newBlock={
		index : this.chain.length+1,
		timeStamp : new Date(),//Date.now(), //The static Date.now() method returns the number of milliseconds elapsed since January 1, 1970
		records : this.pendingRecords,
		nonce : nonce,
		hash : Hash,
		previousBlockHash : previousBlockHash,

	};

	this.pendingRecords = [];
	this.chain.push(newBlock);

	return newBlock;
}

blockchain.prototype.getLastBlock=function(){
	return this.chain[this.chain.length-1];
}

blockchain.prototype.createNewRecord =function(amount,sender,recipient)
{
	const newRecord = {
		amount : amount,
		sender : sender,
		recipient : recipient,
		RecordId : uuidv4().split("-").join("")
	}

	return newRecord;
}


blockchain.prototype.addRecordToPendingRecord = function(RecordObj)
{
	this.pendingRecords.push(RecordObj);
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

//checks integrity of blockchain 
blockchain.prototype.chainIsValid = function(blockchain)
{
	let validChain = true;
	for(let i=1 ; i<blockchain.length ; i++)
	{
		const currBlock = blockchain[i];
		const previousBlock = blockchain[i-1];
		const isHashValid = currBlock['previousBlockHash'] === previousBlock['hash'];
		const isDataVaid = currBlock['hash'] === this.hashBlock(previousBlock['hash'], { Records: currBlock['Records'], index: currBlock['index']}, currBlock['nonce']);
		if( !isDataVaid || !isHashValid){ 
			console.log(blockchain[i]);
			validChain=false
		};
	};

	const genesisBlock = blockchain[0];
	const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
	const correctNonce = genesisBlock['nonce'] === 100;
	const correctHash = genesisBlock['hash'] === '0';
	const correctRecord = genesisBlock['Records'].length === 0;

	if(!correctRecord || !correctHash || !correctNonce || !correctPreviousBlockHash){
		console.log(genesisBlock);
		validChain = false;
	}
	

	return validChain;
}

//searches through entire blockchain to search block for giver blockhash
blockchain.prototype.getBlock=function(blockHash){
	let correctBlock = null;
	this.chain.forEach(block=>{
		if(block.hash === blockHash)
		{
			correctBlock = block;
		}
	});
	return correctBlock;
};


//searches entire blockchain for searching perticular Record
blockchain.prototype.getRecord=function(RecordId){
	let correctBlock = null;
	let correctRecord = null;
	this.chain.forEach(block=>{
		block.Records.forEach(Record=>{
			if(Record.RecordId === RecordId)
			{
				correctBlock = block;
				correctRecord = Record;
			}
		});
	});
	return {
		block : correctBlock,
		Record : correctRecord
	};
};

//this will collect all Records done by given address and also calculate balance of that address
blockchain.prototype.getAddressData = function(address){
	const addressRecords =[];
	this.chain.forEach(block =>{
		block.Records.forEach(Record =>{
			if(Record.sender === address || Record.recipient === address)
				addressRecords.push(Record);
		});
	});

	let balance = 0;
	addressRecords.forEach(Record=>{
		if(address === Record.sender)
			balance -= Record.amount;
		else if(address === Record.recipient)
			balance += Record.amount;
	});

	return{
		addressRecords : addressRecords,
		addressBalance : balance
	};
}


module.exports = blockchain;