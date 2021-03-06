const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const blockchain = require('./blockchain');
const rp = require('request-promise');

const {v4 : uuidv4} = require('uuid');
const nodeAddress = uuidv4().split('-').join("");


const port = process.argv[2];


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : false }));

const medicalRecord = new blockchain();

app.get('/blockchain', function (req, res){

	res.send(medicalRecord);
}); 




//this end point is used for creating new Record and broadcasting them to other nodes.
app.post('/record/broadcast',function(req,res){
	let newRecord = medicalRecord.createNewRecord(req.body.doctor , req.body.patient , req.body.description , req.body.prescription);
	medicalRecord.addRecordToPendingRecords(newRecord);


	let requestPromises=[];
	medicalRecord.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/record',
			method: 'POST',
			body: newRecord,
			json: true
		};
		requestPromises.push(rp(requestOptions));
		
	});

	Promise.all(requestPromises)
	.then(data=>{
		res.json({'Note':'Record created and broadcasted successfully'});
	});

});


//this end point is used for registering new Record broadcasted by above end point.
//(used by all nodes other then the broadcasting point)
//the above both end points is implemented to ensure that all nodes contains same blockchain
app.post('/record', function (req, res){
	
	let newRecord = req.body;
	let blockIndex = medicalRecord.addRecordToPendingRecords(newRecord);
	res.json({"note": `this block will added at index ${blockIndex}`});

});



/*
	This end points does series of task.
	1) It mines new block using proof-of-concept.
	2) Once the block is mined , it distributes new block to other nodes
	3) then it creats new reward Record for miner and distribute it over the network to reside in
	pending Record.(This is not true for medical record) 


*/

app.get('/mine', function (req, res){	

	const lastBlock = medicalRecord.getLastBlock();
	const previousBlockHash = lastBlock['hash'];

	const currBlockData = {
		records : medicalRecord.pendingRecords,
		index : lastBlock['index'] + 1
	};
	const nonce = medicalRecord.proofOfWork(previousBlockHash , currBlockData);
	const hash = medicalRecord.hashBlock(previousBlockHash , currBlockData ,nonce);

	//medicalRecord.createNewRecord(6.25, "00" ,nodeAddress);
	//console.log(nodeAddress);

	const block = medicalRecord.createNewBlock(nonce, previousBlockHash ,hash);

	const requestPromises=[];

	medicalRecord.networkNodes.forEach( networkNodeUrl => {
		const requestOptions={
			uri: networkNodeUrl + "/receive-new-block",
			method: "POST",
			body:{ "newBlock":block},
			json:true
		};
		requestPromises.push(rp(requestOptions));
	})

	Promise.all(requestPromises)
	// .then(data =>{
	// 	const requestOptions = {
	// 		uri : medicalRecord.currNodeUrl + "/Record/broadcast",
	// 		method:"POST",
	// 		body:{
	// 			"amount" : 6.25,
	// 			"sender" : "00",
	// 			"recipient" : nodeAddress
	// 		},
	// 		json: true
	// 	};
	// 	return rp(requestOptions);
	// })
	.then(data =>{
		res.json({
		"note" :"new block mined and broadcasted successfully",
		"block" : block
		});
	});
});



//this end point receives requests from mine end point to add new valid block
//into blockchain of that node 
/*this end receive new blocks broadcasted by some node and append it only if it
 satisfy certains cond.
 1) curr node's previous hash should match with previous node's hash
 2) its index should be alinged with the chain*/
app.post('/receive-new-block',function(req,res){
	const newBlock = req.body.newBlock;
	const lastBlock = medicalRecord.getLastBlock();
	const correctHash = newBlock.previousBlockHash === lastBlock.hash;
	const correctIndex = newBlock['index'] === lastBlock['index'] + 1;

	if(correctIndex && correctHash)
	{
		medicalRecord.chain.push(newBlock);
		medicalRecord.pendingRecords = [];
		res.json({
			note:"new Block received and added successfully",
			block: newBlock
		});
	}
	else
	{
		res.json({
			note:"new Block rejected",
			block: newBlock
		});
	}

});





/*
	1. when new node or request comes to any exisiting node in the network. It will request for 
	register and broadcast node which will register a new node to a curr node and broadcast it to tell
	other nodes to register same node(ONLY REGISTER DONT BROADCAST [OTHERWISE STUCK IN INFIN8 LOOP]
	{that's why "register-node" end point}).
	2. All other nodes will invoke register end point to register new node into thier registery.
	3. now original node will send register-node-bulk request to new node to tell it to register all
	other nodes except it self in the network.
*/
//register node and broadcast it to the network
app.post('/register-and-broadcast-node',function(req,res){
	const newNodeUrl = req.body.newNodeUrl;
	
	//register new node with the currnode
	/*
		if(medicalRecord.currNodeUrl == null)
			medicalRecord.currNodeUrl = newNodeUrl
	*/
	//if its not a current node and not in the listed network nodes then register newNode into 
	//network nodes list
	if(medicalRecord.currNodeUrl!==newNodeUrl && medicalRecord.networkNodes.indexOf(newNodeUrl) == -1)medicalRecord.networkNodes.push(newNodeUrl);

	


	//next step is to broadscast new node. pushing all requests in promises array
	//here we are sending multiple requests. 
	const reqNodePromises = [];
	medicalRecord.networkNodes.forEach(networkNodeUrl => {
		const reqOptions={
			uri: networkNodeUrl + '/register-node',
			method: 'POST',
			body: { 'newNodeUrl' : newNodeUrl},
			json: true 

		};

		reqNodePromises.push(rp(reqOptions));
	});

	//implemnting pushed array(i.g.sending request to register-node endpoint)
	//and we are sending single request to newnode for registering 
	//all existing node in the network using "register-node-bulk" endpoint
	Promise.all(reqNodePromises).then(data =>{
		const bulkRegisterOptions = {
			uri: newNodeUrl + '/register-node-bulk',
			method: 'POST',
			body: { allNetworkNodes: [ ...medicalRecord.networkNodes, medicalRecord.currNodeUrl] },
			// ... is for spreading array elements int array without that it would be array inside array
			json:true
		}

		return rp(bulkRegisterOptions);
	})
	.then(data =>{
		//caling consensus algo so that if any new node comes in beetween even then it reaches to same 
		//state as all other nodes in network
			
			const consensusReqOptions = {
			uri: newNodeUrl + '/consensus',
			method: 'GET',
			json: true
		};
		return rp(consensusReqOptions);
		
	}).then(data=>{
				res.json({'note': "new node registered with network successfully"});		
	});

});

//register a node with the network (used by all other nodes except the original node to only register a new node)
app.post('/register-node',function(req,res){
	const newNodeUrl = req.body.newNodeUrl;
	const nodeNotAlreadyPresent = medicalRecord.networkNodes.indexOf(newNodeUrl) == -1;
	const notCurrentNode = medicalRecord.currNodeUrl !== newNodeUrl; 
	if(nodeNotAlreadyPresent && notCurrentNode) medicalRecord.networkNodes.push(newNodeUrl);
	res.json({'note':"newNode successfully registered"});

});



// register multiple nodes at once (used for newNode to register all other nodes in the network)
app.post('/register-node-bulk',function(req,res){
	const allNetworkNodes = req.body.allNetworkNodes;
	allNetworkNodes.forEach(networkNodeUrl=>{
		const nodeNotAlreadyPresent = medicalRecord.networkNodes.indexOf(networkNodeUrl) == -1;
		const notCurrentNode = medicalRecord.currNodeUrl !== networkNodeUrl;
		if( nodeNotAlreadyPresent && notCurrentNode ) medicalRecord.networkNodes.push(networkNodeUrl); 
	});
	res.json({"note":"Bulk registration successfull."});
});


//implements longest chain rule (considers longest chain as a valid chain)
app.get('/consensus',function(req,res){
	/*here we are getting blockchians of all nodes (I know it must be same but the motive of this
	endpoint is to check integrity of chain only.)*/
	const requestPromises = [];
	medicalRecord.networkNodes.forEach(networkNodeUrl=>{
		const requestOptions ={
			uri: networkNodeUrl + "/blockchain",
			method: "GET",
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	/*Here We are going through all the blockchains that we obtained above and keeping track of 
	longest valid blockchain. If found then updating the current blockchain with the longest valid
	blockchain.*/
	Promise.all(requestPromises)
	.then( blockchains=> {
		const currChainLength = medicalRecord.chain.length;
		let maxChainLength = currChainLength;
		let newLongestChain = null;
		let newPendingRecords = null;

		blockchains.forEach(blockchain=>{
			if(blockchain.chain.length > maxChainLength)
			{
				maxChainLength = blockchain.chain.length;
				newLongestChain = blockchain.chain;
				newPendingRecords = blockchain.pendingRecords; 
			}
		});

		/* If new longest chain is mot found OR if found but not valid then dont update the current node
		chain*/
		if( !newLongestChain || (newLongestChain && !medicalRecord.chainIsValid(newLongestChain)))
		{
			res.json({
				note:"Current chain has not been replaced",
				chian: medicalRecord.chain
			});
		}
		/* else If new longest chain is found and is also valid then update it.*/
		else if( newLongestChain && medicalRecord.chainIsValid(newLongestChain))
		{
			medicalRecord.chain = newLongestChain;
			medicalRecord.pendingRecords = newPendingRecords;
			res.json({
				note:"Current chain has been replaced",
				chian: medicalRecord.chain
			});

		}
	})
});



//this will return block for perticular block hash
app.get('/block/:blockhash', function(req,res){
	let blockHash = req.params.blockhash; 
	/*
		':' will assign value given in url to blockhash variable
		 and we can use them using "req.params".
		 like: localhost:3001/block/24j2g34j23gjh4234dfsf
		 blockhash = 24j2g34j23gjh4234dfsf
	*/
	const correctBlock = medicalRecord.getBlock(blockHash);
	res.json({
		block: correctBlock
	});
	


});

app.get('/test/validChain',function(req,res){
	console.log("reached");
	res.json({ result: medicalRecord.chainIsValid(medicalRecord.chain)}); 
});


//this will return Record for RecordId
app.get('/record/id/:recordId', function(req,res){

	const RecordId = req.params.recordId;
	const RecordData = medicalRecord.getRecord(RecordId);
	res.json({
		Record: RecordData.Record,
		blockHash: RecordData.blockHash
	});
});


//this will return all medical history of patient by given patient id or doctor id
app.get('/get-history/id/:id', function(req,res){
	const id = req.params.id;
	const historyData = medicalRecord.getAddressData(id);
	res.json({
		medicalHistory : historyData
	});
});


//retrives all networknodes url
app.get('/get-all-networknodes',function(req,res){
	const addresses = medicalRecord.networkNodes;
	res.json({
		nodesAddress:[...addresses,medicalRecord.currNodeUrl]
	});
});

/*when any new node wants to join blockchain network it will access handshake endpoint with nodeurl as 
one of the known url of blockchain network which is known by public dns service.

Note: This endpoint will be called by new node and it will pass "node url" as a known url from 
public dns service.

*/
app.post('/handshake',function(req,res){
	const url = req.body.nodeUrl;

	const reqOptions = {
		uri: url+ "/register-and-broadcast-node",
		method: "POST",
		body: { 'newNodeUrl' : medicalRecord.currNodeUrl},
		json: true

	};

	rp(reqOptions).then(data=>{
				res.json({note:"node successfully registered and broadcasted in blockchain network"
		});		
	});

	
});


app.listen(port, function(){
	console.log(`listining to ${port} port...`);
});