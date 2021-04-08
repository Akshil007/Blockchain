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

const bitCoin = new blockchain();

app.get('/blockchain', function (req, res){

	res.send(bitCoin);
}); 




//this end point is used for creating new transaction and broadcasting them to other nodes.
app.post('/transaction/broadcast',function(req,res){
	let newTransaction = bitCoin.createNewTransaction(req.body.amount , req.body.sender , req.body.recipient);
	bitCoin.addTransactionToPendingTransaction(newTransaction);


	let requestPromises=[];
	bitCoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/transaction',
			method: 'POST',
			body: newTransaction,
			json: true
		};
		requestPromises.push(rp(requestOptions));
		
	});

	Promise.all(requestPromises)
	.then(data=>{
		res.json({'Note':'Transaction created and broadcasted successfully'});
	});

});


//this end point is used for registering new transaction broadcasted by above end point.
//(used by all nodes other then the broadcasting point)
//the above both end points is implemented to ensure that all nodes contains same blockchain
app.post('/transaction', function (req, res){
	
	let newTransaction = req.body;
	let blockIndex = bitCoin.addTransactionToPendingTransaction(newTransaction);
	res.json({"note": `thi block will added at index ${blockIndex}`});

});



app.get('/mine', function (req, res){	

	const lastBlock = bitCoin.getLastBlock();
	const previosBlockHash = lastBlock['hash'];

	const currBlockData = {
		transactions : bitCoin.pendingTransactions,
		index : lastBlock['index'] + 1
	};
	const nonce = bitCoin.proofOfWork(previosBlockHash , currBlockData);
	const hash = bitCoin.hashBlock(previosBlockHash , currBlockData ,nonce);

	bitCoin.createNewTransaction(6.5, "00" ,nodeAddress);
	console.log(nodeAddress);

	const block = bitCoin.createNewBlock(nonce, previosBlockHash ,hash);

	res.json({
		"note" :"new block successfully mined",
		"block" : block
	});


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
	if(bitCoin.currNodeUrl!==newNodeUrl && bitCoin.networkNodes.indexOf(newNodeUrl) == -1)bitCoin.networkNodes.push(newNodeUrl);


	//next step is to broadscast new node. pushing all requests in promises array
	//here we are sending multiple requests. 
	const reqNodePromises = [];
	bitCoin.networkNodes.forEach(networkNodeUrl => {
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
			body: { allNetworkNodes: [ ...bitCoin.networkNodes, bitCoin.currNodeUrl] },
			// ... is for spreading array elements int array without that it would be array inside array
			json:true
		}

		return rp(bulkRegisterOptions);
	})
	.then(data =>{
		res.json({'note': "new node registered with network successfully"});
	});

});

//register a node with the network (used by all other nodes except the original node to only register a new node)
app.post('/register-node',function(req,res){
	const newNodeUrl = req.body.newNodeUrl;
	const nodeNotAlreadyPresent = bitCoin.networkNodes.indexOf(newNodeUrl) == -1;
	const notCurrentNode = bitCoin.currNodeUrl !== newNodeUrl; 
	if(nodeNotAlreadyPresent && notCurrentNode) bitCoin.networkNodes.push(newNodeUrl);
	res.json({'note':"newNode successfully registered"});

});



// register multiple nodes at once (used for newNode to register all other nodes in the network)
app.post('/register-node-bulk',function(req,res){
	const allNetworkNodes = req.body.allNetworkNodes;
	allNetworkNodes.forEach(networkNodeUrl=>{
		const nodeNotAlreadyPresent = bitCoin.networkNodes.indexOf(networkNodeUrl) == -1;
		const notCurrentNode = bitCoin.currNodeUrl !== networkNodeUrl;
		if( nodeNotAlreadyPresent && notCurrentNode ) bitCoin.networkNodes.push(networkNodeUrl); 
	});
	res.json({"note":"Bulk registration successfull."});
});


app.listen(port, function(){
	console.log(`listining to ${port} port...`);
});