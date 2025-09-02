import { network } from "hardhat";

const { viem } = await network.connect({
  network: "besu",
  chainType: "l1",
});

console.log("Sending transaction using Besu");

const publicClient = await viem.getPublicClient();
const [senderClient] = await viem.getWalletClients();

console.log("Sending 1 wei from", senderClient.account.address, "to itself");


console.log( senderClient.account);


const estimatedGas = await publicClient.estimateGas({
  account: senderClient.account.address,
  to: "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
  value: 1n,
});

console.log("Estimated gas:", estimatedGas);

console.log("Sending transaction");
const tx = await senderClient.sendTransaction({
  to: "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
  value: 1n,
  gas: estimatedGas, // ✅ safer for Besu
});

const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
console.log("Tx mined:", receipt);

