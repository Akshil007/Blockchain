const blockchain = require('./blockchain');

const bitcoin = new blockchain();

const bc = {
"chain": [
{
"index": 1,
"timeStamp": 1617888227916,
"tansactions": [],
"nonce": 100,
"hash": "0",
"previosBlockHash": "0"
},
{
"index": 2,
"timeStamp": 1617889608662,
"tansactions": [
{
"amount": 400,
"sender": "aadsd876sdadaasd8as6d87",
"recipient": "dsfaf34ewfae98a7s8d7r43re",
"transactionId": "92cf15cd901f4303a08801f9535e209c"
},
{
"amount": 200,
"sender": "aadsd876sdadaasd8as6d87",
"recipient": "dsfaf34ewfae98a7s8d7r43re",
"transactionId": "a1c8a62f07db460fb12ee6394b151767"
}
],
"nonce": 49885,
"hash": "0000d28dc7519d62b257fdb4269fb2310ef64ce985423d4dcd2ad1b9c5423fa1",
"previosBlockHash": "0"
},
{
"index": 3,
"timeStamp": 1617889613859,
"tansactions": [
{
"amount": 12.5,
"sender": "00",
"recipient": "fb8f1c74705c45e3a2bb1541845b5a49",
"transactionId": "6b172ad6538a4ceb888683195f977b2c"
}
],
"nonce": 12643,
"hash": "0000236bb9318e115c9d3482bd4325cc7eda1db614bd40673ac0ed009beb1f62",
"previosBlockHash": "0000d28dc7519d62b257fdb4269fb2310ef64ce985423d4dcd2ad1b9c5423fa1"
},
{
"index": 4,
"timeStamp": 1617889615578,
"tansactions": [
{
"amount": 12.5,
"sender": "00",
"recipient": "fb8f1c74705c45e3a2bb1541845b5a49",
"transactionId": "5deac95109d040aca3b4e6ad3462269d"
}
],
"nonce": 54494,
"hash": "000033b4cb94e8bc2d3d5dac22f6e71cabf1cbd29c932721d2b6629552d543bb",
"previosBlockHash": "0000236bb9318e115c9d3482bd4325cc7eda1db614bd40673ac0ed009beb1f62"
},
{
"index": 5,
"timeStamp": 1617889639171,
"tansactions": [
{
"amount": 12.5,
"sender": "00",
"recipient": "fb8f1c74705c45e3a2bb1541845b5a49",
"transactionId": "76fc6e4b5e5d447faa557c262493d9c1"
},
{
"amount": 300,
"sender": "aadsd876sdadaasd8as6d87",
"recipient": "dsfaf34ewfae98a7s8d7r43re",
"transactionId": "c8f687b56d3840b8b3f989d1fa7425ad"
},
{
"amount": 350,
"sender": "aadsd876sdadaasd8as6d87",
"recipient": "dsfaf34ewfae98a7s8d7r43re",
"transactionId": "74b694f43e9b4d9d9d99ffb0e5193c97"
}
],
"nonce": 33619,
"hash": "00001e9c40410e7c957e6441aad6fb511001d1d546ba3a8d6944353ce0ca1e04",
"previosBlockHash": "000033b4cb94e8bc2d3d5dac22f6e71cabf1cbd29c932721d2b6629552d543bb"
},
{
"index": 6,
"timeStamp": 1617889641479,
"tansactions": [
{
"amount": 12.5,
"sender": "00",
"recipient": "fb8f1c74705c45e3a2bb1541845b5a49",
"transactionId": "aa91202dcac942c182401fdd71ca4a8b"
}
],
"nonce": 171450,
"hash": "000020be72cc88b45f25a501590e0eebe10900d1560867663abd17236c6a68d4",
"previosBlockHash": "00001e9c40410e7c957e6441aad6fb511001d1d546ba3a8d6944353ce0ca1e04"
}
],
"pendingTransactions": [
{
"amount": 12.5,
"sender": "00",
"recipient": "fb8f1c74705c45e3a2bb1541845b5a49",
"transactionId": "753643498fea4ca3978e7d7bf5705bbf"
}
],
"currNodeUrl": "http://localhost:3001",
"networkNodes": []
};

console.log(bitcoin.chainIsValid(bc));
