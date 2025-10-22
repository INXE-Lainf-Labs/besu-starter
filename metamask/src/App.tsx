import { useState } from 'react'

import './App.css'
import { MetaMaskSDK } from "@metamask/sdk"
import { ethers } from 'ethers';
import path from 'path';
import fs from 'fs';
import contractJson from './assets/contract/SendEther.json';



function App() {


  //It's necessary to call a function from the contract.
  const contractAbi = contractJson.abi;

  //it's necessary to get the bytecode from the contract
  const contractBytecode = contractJson.evm.bytecode.object;

  //For better blockchain hosting, containerize the app and route it through Caddy.
  const host = "http://localhost:8545";

  //address from smart contract 
  var adresscontract = "";



  const MMSDK = new MetaMaskSDK({
    dappMetadata: {
      name: "Example JavaScript Dapp",
      url: window.location.href,
    },
    preferDesktop: true,
  })

  // Network configurations
  async function connect() {

    console.log("connect to network")


    const network = {
      chainId: "0x539",
      name: "Besu",
      rpcUrls: ["http://localhost:8545"],
      nativeCurrency: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18
      },
    }
    const ethereum = MMSDK.getProvider()

    // Connect to MetaMask
    const accounts = await MMSDK.connect()


    // Make requests
    const result = await ethereum?.request({
      method: "eth_accounts",
      params: []
    })

    try {
      // Try to switch to the network
      await ethereum?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network?.chainId }]
      });
    } catch (erro: any) {
      // If the error code is 4902, the network needs to be added
      if (erro.code === 4902) {
        try {
          await ethereum?.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: network.chainId,
              chainName: network.name,
              rpcUrls: network.rpcUrls,
              nativeCurrency: network.nativeCurrency,

            }]
          });

          await ethereum?.request({
            method: "wallet_switchEthereumChain",
            params: [{
              chainId: network.chainId,
              chainName: network.name,
              rpcUrls: network.rpcUrls,
              nativeCurrency: network.nativeCurrency,

            }]
          });
        } catch (addError) {
          console.error("Error adding network:", addError);
        }
      } else {
        console.error("Error switching network:", erro);
      }
    }


  }

  //receive eth from a wallet in the blockchain,. 
  async function receive() {
    console.log("receive 1 eth from blockchain")

    const ethereum = MMSDK.getProvider()

    // Connect to MetaMask
    const accounts = await MMSDK.connect()

    const ob = {
      acc: accounts[0],

    }
    console.log(accounts);
    fetch('http://localhost:3000/receive', {
      method: "post",
      headers: {
        "Content-Type": "application/json ; charset=UTF-8"
      },
      body: JSON.stringify(ob)

    }).then(response => {
      console.log(JSON.stringify(ob));
      console.log(response);
    })
      .catch(error => {

        console.log(error);
      });



  }

  // Track transaction status
  function watchTransaction(txHash: any) {
    const ethereum = MMSDK.getProvider()
    return new Promise((resolve, reject) => {
      const checkTransaction = async () => {
        try {

          if (ethereum) {
            const tx: any = await ethereum.request({
              method: "eth_getTransactionReceipt",
              params: [txHash],
            });

            if (tx) {
              if (tx.status === "0x1") {
                resolve(tx);
              } else {
                reject(new Error("Transaction failed"));
              }
            } else {
              setTimeout(checkTransaction, 2000); // Check every 2 seconds
            }
          }
        } catch (error: any) {
          reject(error);
        }
      };

      checkTransaction();
    });
  }


  async function sendTransaction(recipientAddress: any, amount: any) {

    console.log("check transaction")

    const ethereum = MMSDK.getProvider()


    try {
      if (ethereum) {
        // Get current account
        const accounts: any = await ethereum.request({
          method: "eth_requestAccounts"
        });

        const from = accounts[0];


        const transaction = {
          from,
          to: recipientAddress,
          value: "0x100",  //amount of eth to transfer
          gasLimit: "0x24A22" //max number of gas units the tx is allowed to use
          // Gas fields are optional - MetaMask will estimate
        };

        // Send transaction
        const txHash = await ethereum.request({
          method: "eth_sendTransaction",
          params: [transaction],
        });
        return txHash;

      }
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("Transaction rejected by user");
      }
      throw error;
    }
  }


  async function send() {
    console.log("send eth to wallet")

    const wallet = (document.getElementById("wallet") as HTMLInputElement).value
    const value = (document.getElementById("wallet") as HTMLInputElement).value
    const status = document.getElementById("status");

    try {

      if (status) {
        status.textContent = "Sending transaction...";
        const txHash = await sendTransaction(wallet, value);
        status.textContent = `Transaction sent: ${txHash}`;

        // Watch for confirmation
        status.textContent = "Waiting for confirmation...";
        await watchTransaction(txHash);
        status.textContent = "Transaction confirmed!";
      }

    } catch (error: any) {
      if (status) {
        status.textContent = `Error: ${error.message}`;
      }
    }

  }


  async function deploy() {

    console.log("deploy contract")
    const ethereum = MMSDK.getProvider()
    try {
      console.log("Contract bytecode size:", contractBytecode.length / 2, "bytes");
      //console.log(ethereum);


      if (ethereum && adresscontract == '') {
        // Request account access
        console.log("Requesting MetaMask account access...");
        const accounts: any = await ethereum.request({ method: 'eth_requestAccounts' });

        // Create provider from MetaMask
        const provider: any = new ethers.BrowserProvider(ethereum);

        // Get signer from MetaMask
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        console.log("Connected with address:", userAddress);

        // Deploy MonetizaFactory
        console.log("Deploying MonetizaFactory...");

        const factory = new ethers.ContractFactory(contractAbi, contractBytecode, signer);

        // Get fee data for gas estimation
        const feeData = await provider.getFeeData();

        // Deploy contract with wallet.address as constructor parameter
        const contract = await factory.deploy();

        console.log("Transaction hash:", contract.deploymentTransaction()?.hash);
        console.log("Waiting for deployment confirmation...");

        // Wait for deployment to complete
        const deployed = await contract.waitForDeployment();
        console.log("MonetizaFactory deployed at:", deployed.target);
        adresscontract = await deployed.getAddress();
        return deployed.target;

      }

    } catch (error) {
      console.error("Deployment failed:", error);
      throw error;
    }

  }

  async function sendViaTransfer() {

    console.log("send transaction  through contract function sendViaTransfer")
    const ethereum = MMSDK.getProvider()
    // Create provider from MetaMask
    if (ethereum && adresscontract != '') {
      const provider: any = new ethers.BrowserProvider(ethereum);

      // 1. O Signer tem a chave do usuário e a capacidade de assinar transações.
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      console.log("Connected with address:", userAddress);

      const contract = new ethers.Contract(adresscontract, contractAbi, signer);
      const amountToSend = ethers.parseEther("0.01");

      const tx = await contract.sendViaTransfer(
        "0xC0F53964CE977EB8e1Ccf0427527B36f7F3Ab9Fd",
        {
          value: amountToSend,
          gasLimit: 100000 // Add explicit gas limit
        }

      );
      const receipt = await tx.wait();

      console.log("Transação enviada com sucesso. Hash:", tx.hash);


      return tx;
    }

  }

  async function sendViaSend() {

    console.log("send transaction  through contract function sendViaSend")

    const ethereum = MMSDK.getProvider()
    // Create provider from MetaMask
    if (ethereum && adresscontract != '') {
      const provider: any = new ethers.BrowserProvider(ethereum);

      // 1. O Signer tem a chave do usuário e a capacidade de assinar transações.
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      console.log("Connected with address:", userAddress);


      const contract = new ethers.Contract(adresscontract, contractAbi, signer);
      const amountToSend = ethers.parseEther("0.02");

      const tx = await contract.sendViaSend(
        "0xC0F53964CE977EB8e1Ccf0427527B36f7F3Ab9Fd",
        {
          value: amountToSend,
          gasLimit: 100000 // Add explicit gas limit
        }

      );

      const receipt = await tx.wait();

      console.log("Transação enviada com sucesso. Hash:", tx.hash);


      return tx;
    }

  }

  async function sendViaCall() {

    console.log("send transaction  through contract function sendViaSend")


    const ethereum = MMSDK.getProvider()
    // Create provider from MetaMask
    if (ethereum && adresscontract != '') {
      const provider: any = new ethers.BrowserProvider(ethereum);

      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      console.log("Connected with address:", userAddress);

      const contract = new ethers.Contract(adresscontract, contractAbi, signer);

      const amountToSend = ethers.parseEther("0.03");

      const tx = await contract.sendViaCall(
        "0xC0F53964CE977EB8e1Ccf0427527B36f7F3Ab9Fd",
        {
          value: amountToSend,
          gasLimit: 100000 // Add explicit gas limit
        }

      );

      const receipt = await tx.wait();

      console.log("Transação enviada com sucesso. Hash:", tx.hash);


      return tx;
    }

  }
  return (
    <>
      <h1>Besu</h1>
      <div className="card">
        <button onClick={connect}>
          Connect
        </button>
        <br />
        <br />
        <button onClick={receive}>
          Receive
        </button>
        <br />
        <br />
        <div>
          <div id="status"></div>
          &nbsp; &nbsp;
          <label>
            Wallet: <input id="wallet" name="wallet" />
          </label>
          &nbsp; &nbsp;
          <label>
            Valor: <input id="value" name="value" />
          </label>
          &nbsp; &nbsp;
          <button onClick={send}>
            Send
          </button>

        </div>
        <br />
        <div>
          <button onClick={deploy}>
            Deploy contract
          </button>
          <br />
          <br />
          <button onClick={sendViaTransfer}>
            send Via Transfer
          </button>
          <br />
          <br />
          <button onClick={sendViaSend}>
            send Via Send
          </button>
          <br />
          <br />
          <button onClick={sendViaCall}>
            send Via Call
          </button>

        </div>
        <br />
        <br />

      </div>


    </>
  )
}

export default App
