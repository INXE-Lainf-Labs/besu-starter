const path = require('path');
const fs = require('fs-extra');
var ethers = require('ethers');

// RPCNODE details
const { tessera, besu } = require("../keys.js");
const host = besu.rpcnode.url;
const accountPrivateKey = besu.rpcnode.accountPrivateKey;

// abi and bytecode generated from simplestorage.sol:
// > solcjs --bin --abi simplestorage.sol
const contractJsonPath = path.resolve(__dirname, '../', 'contracts', 'MonetizaFactory.json');
const contractJson = JSON.parse(fs.readFileSync(contractJsonPath));
const contractAbi = contractJson.abi;
const contractBytecode = contractJson.evm.bytecode.object




 async function deployMonetizaFactory() {
  const factory = new ethers.ContractFactory(
    MonetizaFactoryArtifact.abi,
    MonetizaFactoryArtifact.bytecode,
    signer
  );

  const contract = await factory.deploy(await signer.getAddress());
  await contract.deployed();
  console.log("MonetizaFactory deployed at:", contract.address);

  factoryContract = contract;
  return contract.address;
}

 async function loadMonetizaFactory(address) {
  factoryContract = new ethers.Contract(address, MonetizaFactoryArtifact.abi, signer);
  return factoryContract;
}

 async function getContractCreatedEventByWalletAndAddress(factoryContract, walletAddress, deployedAddress, fromBlock = 0, toBlock = "latest") {
  const filter = factoryContract.filters.ContractCreated(null, deployedAddress, walletAddress);

  const events = await factoryContract.queryFilter(filter, fromBlock, toBlock);

  return events.map(event => ({
    id: event.args.id.toNumber(),
    contractAddress: event.args.contractAddress,
    owner: event.args.owner,
    blockNumber: event.blockNumber,
    txHash: event.transactionHash
  }));
}

 async function setK(value) {
  const tx = await factoryContract.setK(value);
  await tx.wait();
  console.log("K set to:", value);
}

 async function createNewMonetiza(wallet) {
  const tx = await factoryContract.createNewContract(wallet);
  const receipt = await tx.wait();
  const event = receipt.events.find(e => e.event === 'ContractCreated');
  const contractAddr = event.args.contractAddress;
  console.log("New Monetiza contract created:", contractAddr);
  return contractAddr;
}

 async function createEventOn(index, vin, timestamp, fuel_b, abastecimento, usertank) {
  const tx = await factoryContract.createevent(index, vin, timestamp, fuel_b, abastecimento, usertank);
  await tx.wait();
  console.log("Event created");
}

 async function closeEvent(index) {
  const tx = await factoryContract.closeevent(index);
  await tx.wait();
  console.log("Event closed");
}

 async function addTrajeto(index, hash, dist, fuel, time, timeless) {
  const tx = await factoryContract.createTrajeto(index, hash, dist, fuel, time, timeless);
  await tx.wait();
  console.log("Trajeto added");
}

 async function getNEvent(index) {
  const result = await factoryContract.getNEvent(index);
  console.log("NEvent:", result.toString());
  return result.toNumber();
}

 function linearRegression(y,x){
        var lr = {};
        var n = y.length;
        var sum_x = 0;
        var sum_y = 0;
        var sum_xy = 0;
        var sum_xx = 0;
        var sum_yy = 0;

        for (var i = 0; i < y.length; i++) {

            sum_x += x[i];
            sum_y += y[i];
            sum_xy += (x[i]*y[i]);
            sum_xx += (x[i]*x[i]);
            sum_yy += (y[i]*y[i]);
        } 

        lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
        lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
        lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);

        return lr;
}

async function main(wallet_user) {
  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);
// var contract = createContract(provider, wallet, contractAbi, contractBytecode, 47);
//  contractAddress = await contract.getAddress();

  console.log("Deploying contract...");
  console.log(wallet.address);

  // Deploy MonetizaFactory
  const factory = new ethers.ContractFactory(contractAbi, contractBytecode, wallet);
  const monetizaFactory = await factory.deploy(wallet.address);
  const deployed = await monetizaFactory.waitForDeployment();

  console.log("MonetizaFactory deployed at:", monetizaFactory.target);


  
  // Call setK
  const txSetK = await monetizaFactory.setK(3);
  await txSetK.wait();
  console.log("K set to 42");
  
  

  // Create a new Monetiza contract
  const txNew = await monetizaFactory.createNewContract(wallet_user);
  const receipt = await txNew.wait();
  const event = receipt.events.find(e => e.event === "ContractCreated");
  const monetizaAddress = event.args.contractAddress;
  console.log("Monetiza deployed at:", monetizaAddress);

  // Call createevent
  await monetizaFactory.createevent(
    0,
    "VIN123",
    "2025-08-06T20:00:00Z",
    100,
    10,
    50
  );
  console.log("Event created");
  /*
  // Add a trajeto
  const hash = ethers.utils.formatBytes32String("trajeto1");
  await monetizaFactory.createTrajeto(0, hash, 1200, 5, 300, 30);
  console.log("Trajeto created");

  // Close the event
  await monetizaFactory.closeevent(0);
  console.log("Event closed");

  // Get number of events
  const nevent = await monetizaFactory.getNEvent(0);
  console.log("Number of events:", nevent.toString());
  */
}

if (require.main === module) {
  main();
}

module.exports = exports = main
