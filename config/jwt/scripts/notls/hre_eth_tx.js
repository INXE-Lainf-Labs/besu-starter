const path = require('path');
const fs = require('fs-extra');
var ethers = require('ethers');

// member1 details
const { accounts, besu } = require("../keys.js");
const host = besu.rpcnode.url;
// one of the seeded accounts
const accountAPrivateKey = accounts.a.privateKey;

async function main() {
  const provider = new ethers.JsonRpcProvider(host);

  const walletA = new ethers.Wallet(accountAPrivateKey, provider);
  var accountABalance = await provider.getBalance(walletA.address);
  console.log("Account A has balance of: " + accountABalance);

  // create a new account to use to transfer eth to
  const walletB = ethers.Wallet.createRandom()
  var accountBBalance = await provider.getBalance(walletB.address);
  console.log("Account B has balance of: " + accountBBalance);

  const nonce = await provider.getTransactionCount(walletA.address);
  console.log(nonce);

  // send some eth from A to B
  /*
  const txn = {
    nonce: nonce,
    from: walletA.address,
    to: 
    value: 0x10,  //amount of eth to transfer
  };

  */
  const txn = {
    to: walletB.address,
    value:0x10,
    //gasLimit: 21000,
    //gasPrice: (await provider.getFeeData()).gasPrice,
    nonce: nonce
  };

  console.log("create and sign the txn")
  const signedTx = await walletA.sendTransaction(txn);
  const receipt = await signedTx.wait(1);
  console.log(receipt);

  //After the transaction there should be some ETH transferred
  accountABalance = await provider.getBalance(walletA.address);
  console.log("Account A has balance of: " + accountABalance);
  accountBBalance = await provider.getBalance(walletB.address);
  console.log("Account B has balance of: " + accountBBalance);

}

if (require.main === module) {
  main();
}


module.exports = {
  main
};
