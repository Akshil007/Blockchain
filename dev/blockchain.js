//sha 256 for hashing
const sha256=require('sha256'); 
const {v4 : uuidv4} = require('uuid');
const port = process.argv[2];
const currNodeUrl = "http://"+process.argv[3]+":"+port;

function blockchain()
{
	
	this.chain=[];
	this.pendingRecords=[];
	this.currNodeUrl=currNodeUrl;
	console.log(this.currNodeUrl);
	this.networkNodes = [];//this array contains all nodes address except curr node's


	//first block of blockchain is known as genesis block. it does not have previous hash
	//and thats why does not have its own hash
	this.createNewBlock(100,'0','0');
}


//this creates the new block and add it to cuur node's blockchain
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

blockchain.prototype.createNewRecord =function(Doctor,Patient,Description,Prescription)
{
	const newRecord = {
		doctor : Doctor,
		patient : Patient,
		description : Description,
		prescription : Prescription,
		RecordId : uuidv4().split("-").join("")
	}

	return newRecord;
}


blockchain.prototype.addRecordToPendingRecords = function(RecordObj)
{
	this.pendingRecords.push(RecordObj);
	return this.getLastBlock()['index']+1;
}

/*From which data hash is calculate?
1)previous block hash
2)currBlockData (which includes)=> records + index 
3)nonce*/
blockchain.prototype.hashBlock = function(previousBlockHash, currBlockData ,nonce)
{
	const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currBlockData);
	const hash = sha256(dataAsString);
	return hash;
}

/*
What is nonce?
nonce is a number using which generated hash satisfy the hash requirements (like generated hash
starting with 4 0s).
*/
blockchain.prototype.proofOfWork = function(previousBlockHash, currBlockData)
{
	/* This method will do a work till it gets first 4 character as 0000 in hash.
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
/*
How are we checking that a current chain is valid or not?
First ,We are going through each and every block comparing curr block previos hash with privious block's
hash and also comparing current block's hash with recalculated hash.

In second phase we are checking genesis block which is our first block which has the specified 
properties like its hash is 0 etc.

If above both phase are correct then chain is valid otherwise its invalid.
*/
blockchain.prototype.chainIsValid = function(blockchain)
{
	let validChain = true;
	for(let i=1 ; i<blockchain.length ; i++)
	{
		const currBlock = blockchain[i];
		const previousBlock = blockchain[i-1];
		const isHashValid = currBlock['previousBlockHash'] === previousBlock['hash'];
		const isDataVaid = currBlock['hash'] === this.hashBlock(previousBlock['hash'], { records: currBlock['records'], index: currBlock['index']}, currBlock['nonce']);
		if( !isDataVaid || !isHashValid){ 
			console.log(blockchain[i]);
			validChain=false
		};
	};

	const genesisBlock = blockchain[0];
	const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
	const correctNonce = genesisBlock['nonce'] === 100;
	const correctHash = genesisBlock['hash'] === '0';
	const correctRecord = genesisBlock['records'].length === 0;

	if(!correctRecord || !correctHash || !correctNonce || !correctPreviousBlockHash){
		console.log(genesisBlock);
		validChain = false;
	}
	

	console.log(validChain);
	return validChain;
}

//searches through entire blockchain to search block for given blockhash
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
		block.records.forEach(Record=>{
			if(Record.RecordId === RecordId)
			{
				correctBlock = block;
				correctRecord = Record;
			}
		});
	});
	return {
		block : correctBlock,
		Record : correctRecord,
		blockHash : correctBlock.hash
	};
};

/*
this will return medical history of given patient id or doctor id
*/
blockchain.prototype.getAddressData = function(id){
	const historyRecords =[];
	this.chain.forEach(block =>{
		block.records.forEach(Record =>{
			if(Record.patient === id || Record.doctor === id)
				historyRecords.push(Record);
		});
	});

	return{
		Records : historyRecords,
	};
}


module.exports = blockchain;