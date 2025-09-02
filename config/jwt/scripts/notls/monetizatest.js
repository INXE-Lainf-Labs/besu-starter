const path = require('path');
const fs = require('fs-extra');
var ethers = require('ethers');

const haversine = require('haversine-distance')
const rl = require('ml-regression-simple-linear');


// RPCNODE details
const { tessera, besu } = require("../keys.js");
const { join } = require('path');
const host = besu.rpcnode.url;
const accountPrivateKey = besu.rpcnode.accountPrivateKey;

// abi and bytecode generated from simplestorage.sol:
// > solcjs --bin --abi simplestorage.sol
const contractJsonPath = path.resolve(__dirname, '../', 'contracts', 'MonetizaFactory.json');
const contractJson = JSON.parse(fs.readFileSync(contractJsonPath));
const contractAbi = contractJson.abi;
const contractBytecode = contractJson.evm.bytecode.object

//função utilizada pelo servidor para fazer o deploy do contrato inteligente
async function createMasterContract() {
  //console.log("Contract bytecode size:", contractBytecode.length / 2, "bytes");
  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);

  // Deploy MonetizaFactory
  const factory = new ethers.ContractFactory(contractAbi, contractBytecode, wallet);
  //console.log(wallet.address);
  const feeData = await provider.getFeeData();
  const contract = await factory.deploy(wallet.address);
  // The c

  const deployed = await contract.waitForDeployment();
  console.log("MonetizaFactory deployed at:", deployed.target);
  return deployed.target;
}

async function set_k(deployedContractAddress, value) {
  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);
  console.log(deployedContractAddress, value);
  const readOnlyContract = new ethers.Contract(deployedContractAddress, contractAbi, provider);
  const writableContract = readOnlyContract.connect(wallet);
  const txSetK = await writableContract.setK(value);
  await txSetK.wait();
  console.log("K set to 3");
}

async function getOpenEventStatus(mastercontract, id) {
  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);
  const readOnlyContract = new ethers.Contract(mastercontract, contractAbi, provider);
  const writableContract = readOnlyContract.connect(wallet);
  return (await writableContract.checkStatus(id));
}


async function existContract(mastercontract, wallet_user) {
  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);


  const readOnlyContract = new ethers.Contract(mastercontract, contractAbi, provider);
  const writableContract = readOnlyContract.connect(wallet);
  // Get events from block 0 to latest
  const contracts = await writableContract.queryFilter("ContractCreated", 0, "latest");

  a = false

  for (const contract of contracts) {
    if (contract.args.owner == wallet_user) {
      a = true;
    }
  }

  return a;

}



async function getUserContract(mastercontract, wallet_user) {
  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);


  const readOnlyContract = new ethers.Contract(mastercontract, contractAbi, provider);
  const writableContract = readOnlyContract.connect(wallet);
  // Get events from block 0 to latest
  const contracts = await writableContract.queryFilter("ContractCreated", 0, "latest");



  for (const contract of contracts) {
    if (contract.args.owner == wallet_user) {
      return contract;
    }
  }


}



//recupera trajetos em eventos fechados
async function getEventOpen(mastercontract, wallet_user) {
  const provider = new ethers.JsonRpcProvider(host);

  const wallet = new ethers.Wallet(accountPrivateKey, provider);
  const readOnlyContract = new ethers.Contract(mastercontract, contractAbi, provider);
  const writableContract = readOnlyContract.connect(wallet);


  exist = await existContract(mastercontract, wallet_user);

  if (exist) {
    help = await getUserContract(mastercontract, wallet_user);



    if (await getOpenEventStatus(mastercontract, help.args.id) == true) {
      console.log(await writableContract.getEvents(help.args.id));
      return await writableContract.getEvents(help.args.id);
    } else {
      console.log("Não existe evento aberto");
      return false
    }


  } else {
    console.log("contrato não existente");
    return false
  }
}


//recupera trajetos em eventos fechados
async function getEventClose(mastercontract, wallet_user) {

  const provider = new ethers.JsonRpcProvider(host);

  const wallet = new ethers.Wallet(accountPrivateKey, provider);

  helpadd = await getUserContract(mastercontract, wallet_user)

  const contractJsonPath2 = path.resolve(__dirname, '../', 'contracts', 'Monetiza.json');
  const contractJson2 = JSON.parse(fs.readFileSync(contractJsonPath2));
  const contractAbi2 = contractJson2.abi;

  const monetizaContract = new ethers.Contract(helpadd.args[1], contractAbi2, provider);

  const logs = await monetizaContract.queryFilter("EventRegistered", 0, "latest");

  //console.log(logs);

  aux = [];
  for (const log of logs) {

    if (log.args.wallet == wallet_user) {
      helpaux = {
        idevent: log.args.idEvent,
        wallet: log.args.wallet,
        contractAddress: log.args.contractAddress,
        vin: log.args.vin,
        t: log.args.t,
        fuel_b: log.args.fuel_b,
        fuel_e: log.args.fuel_e,
        abastecimento: log.args.abastecimento,
        usertank: log.args.usertank,
      };
      aux.push(helpaux)
      console.log(helpaux)

    }
  }

  return aux;

}

//recupera trajetos em eventos abertos
async function getPathEventOpen(mastercontract, wallet_user) {
  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);
  const readOnlyContract = new ethers.Contract(mastercontract, contractAbi, provider);
  const writableContract = readOnlyContract.connect(wallet);


  exist = await existContract(mastercontract, wallet_user);


  if (exist) {
    help = await getUserContract(mastercontract, wallet_user);


    if (await getOpenEventStatus(mastercontract, help.args.id) == true) {
      return await writableContract.getpath(help.args.id);
    } else {
      return "Não existe evento aberto";
    }

  } else {
    console.log("contrato não existente");
  }

}

//recupera trajetos em eventos fechados
async function getPathEventClose(mastercontract, wallet_user) {

  const provider = new ethers.JsonRpcProvider(host);

  helpadd = await getUserContract(mastercontract, wallet_user)

  const contractJsonPath2 = path.resolve(__dirname, '../', 'contracts', 'Monetiza.json');
  const contractJson2 = JSON.parse(fs.readFileSync(contractJsonPath2));
  const contractAbi2 = contractJson2.abi;

  const monetizaContract = new ethers.Contract(helpadd.args[1], contractAbi2, provider);

  const logs = await monetizaContract.queryFilter("TrajetosRegistered", 0, "latest");

  aux = [];
  for (const log of logs) {

    if (log.args.wallet == wallet_user) {
      aux.push(log)

    }
  }

  return aux;
}

async function createUserContract(mastercontract, wallet_user) {
  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);
  // Create a new Monetiza contract
  const readOnlyContract = new ethers.Contract(mastercontract, contractAbi, provider);
  const writableContract = readOnlyContract.connect(wallet);
  exist = await existContract(mastercontract, wallet_user);

  if (exist == false) {
    const txNew = await writableContract.createNewContract(wallet_user);
    const receipt = await txNew.wait();
    console.log("usuario criado");
    return true;
  } else {
    console.log("contrato existente");
  }

}


async function CreateUserEvent(data, mastercontract, wallet_user) {

  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);
  const readOnlyContract = new ethers.Contract(mastercontract, contractAbi, provider);
  const writableContract = readOnlyContract.connect(wallet);

  exist = await existContract(mastercontract, wallet_user);

  if (exist) {
    help = await getUserContract(mastercontract, wallet_user);
    const decimals = 18; // depende do token
    const df = ethers.parseUnits(data.fuel_b.toString(), decimals);
    const da = ethers.parseUnits(data.abastecimento.toString(), decimals);
    const du = ethers.parseUnits(data.usertank.toString(), decimals);
    const txNew = await writableContract.createEvent(help.args.id, wallet_user, help.args.contractAddress, data.vin, data.t, df, da, du);
    const receipt = await txNew.wait();
    return true;
  } else {
    console.log("contrato não existente");
    return false;
  }
}

async function closeUserEvent(mastercontract, wallet_user) {

  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);
  // Create a new Monetiza contract
  const readOnlyContract = new ethers.Contract(mastercontract, contractAbi, provider);
  const writableContract = readOnlyContract.connect(wallet);


  exist = await existContract(mastercontract, wallet_user);

  if (exist) {
    help = await getUserContract(mastercontract, wallet_user);


    if (await getOpenEventStatus(mastercontract, help.args.id) == true) {

      const txNew = await writableContract.closeevent(help.args.id, wallet_user, help.args.contractAddress);
      const receipt = await txNew.wait();
      console.log(receipt);
      console.log("Evento fechado")
      return true;
    } else {
      console.log("Não há eventos em aberto");
      return false;
    }


  } else {
    console.log("contrato não existente");
    return false;
  }


}

async function getuserscore(mastercontract, wallet_user) {

  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);
  // Create a new Monetiza contract
  const readOnlyContract = new ethers.Contract(mastercontract, contractAbi, provider);
  const writableContract = readOnlyContract.connect(wallet);


  exist = await existContract(mastercontract, wallet_user);

  if (exist) {
    help = await getUserContract(mastercontract, wallet_user);
    return await writableContract.getscore(help.args.id);
  } else {
    console.log("contrato não existente");
    return false;
  }


}


async function getcoin(mastercontract, wallet_user) {

  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);
  // Create a new Monetiza contract
  const readOnlyContract = new ethers.Contract(mastercontract, contractAbi, provider);
  const writableContract = readOnlyContract.connect(wallet);


  exist = await existContract(mastercontract, wallet_user);

  if (exist) {
    help = await getUserContract(mastercontract, wallet_user);

    const value = await writableContract.getcoin(help.args.id);
    const txNew = await writableContract.setcoin(help.args.id);
    const receipt = await txNew.wait();
    console.log(receipt);
    return value;


  } else {
    console.log("contrato não existente");
    return false;
  }


}



async function mediavector(a) {
  media = 0.0
  for (i = 0; i < a.length; i++) {
    media = media + a[i]
  }

  media = media / ((a.length) - 1);
  return media

}

async function Timeliness(values, k) {


  k_aux = 1 / k



  f = await mediavector(values)


  f_aux = 1 / f



  if (f_aux >= k_aux) {
    return 1.0
  }

  f_k = (f_aux / k_aux) / Math.log(f_aux / k_aux)

  res_2 = Math.exp(1)

  timeless = -Math.pow(res_2, f_k) + 1

  if (timeless == NaN) {
    return 0.0;
  }

  return timeless





}

async function insert_path(hash, tuple, mastercontract, wallet_user) {

  exist = await existContract(mastercontract, wallet_user);

  if (exist) {
    help = await getUserContract(mastercontract, wallet_user);

    if (await getOpenEventStatus(mastercontract, help.args.id) == true) {

      listPoints = []
      listFuel = []
      listTime = []

      a = tuple.data;


      for (i = 0; i < a.length; i++) {



        if (parseFloat(tuple.data[i].userdata.pos.lat) != 0.0 && parseFloat(tuple.data[i].userdata.pos.long) != 0.0) {
          point = {
            lat: tuple.data[i].userdata.pos.lat,
            lng: tuple.data[i].userdata.pos.long
          }

          listPoints.push(point)
        }



        listTime.push(tuple.data[i].userdata.time)

        for (j = 0; j < tuple.data[i].userdata.userdata.length; j++) {

          if (tuple.data[i].userdata.userdata[j].pid = "01 2F") {

            listFuel.push(parseFloat(tuple.data[i].userdata.userdata[j].obddata.response))

          }


        }

      }


      listtModify = [0]

      helpsum = 0

      for (i = 0; i < listTime.length; i++) {

        if (i + 1 < listTime.length) {

          //TIME INIT  
          const date1 = new Date(listTime[i]); // First date and time
          const date2 = new Date(listTime[i + 1]); // Second date and time

          // Calculate the difference in milliseconds
          const diffMilliseconds = date2.getTime() - date1.getTime();

          // Convert milliseconds to hours
          const diffHours = diffMilliseconds / (1000);

          helpsum = helpsum + diffHours

          listtModify.push(helpsum)
          //TIME CLOSE  


        }

      }

      timeli = await Timeliness(listtModify, 3);


      //fingindo que adicionei o ruido
      newlistFuel = []

      const regression = new rl.SimpleLinearRegression(listtModify, listFuel);


      const json = regression.toJSON();
      const loaded = rl.SimpleLinearRegression.load(json);
      for (i = 0; i < listFuel.length; i++) {

        newlistFuel.push(loaded.predict(listtModify[i]));
      }
      //console.log(newlistFuel)



      fuel = newlistFuel[0] - newlistFuel[newlistFuel.length - 1]



      timef = listtModify[listtModify.length - 1];

      //console.log(timef);


      hashgenerate = ethers.encodeBytes32String(hash._id.toString());


      distmeters = 0;

      for (i = 0; i < listPoints.length; i++) {


        if (i < listPoints.length - 1) {


          distmeters = haversine(listPoints[i], listPoints[i + 1]);

        }

      }


      const provider = new ethers.JsonRpcProvider(host);
      const wallet = new ethers.Wallet(accountPrivateKey, provider);
      // Create a new Monetiza contract
      const readOnlyContract = new ethers.Contract(mastercontract, contractAbi, provider);
      const writableContract = readOnlyContract.connect(wallet);

      fuel = (fuel / 100) * 40;


      fuel = 1;

      const decimals = 18; // depende do token
      const dm = ethers.parseUnits(distmeters.toString(), decimals);
      const f = ethers.parseUnits(fuel.toString(), decimals);
      const ts = ethers.parseUnits(timef.toString(), decimals);
      const tl = ethers.parseUnits(timeli.toString(), decimals);

      const txNew = await writableContract.createTrajeto(help.args.id, wallet_user, help.args.contractAddress, hashgenerate, dm, f, ts, tl);

      const receipt = await txNew.wait();
      console.log(receipt);

    } else {
      console.log("Não existe evento em aberto")
    }


  } else {
    console.log("contrato não existente");
  }







}

if (require.main === module) {
  createMasterContract();
  set_k();
  existContract();
  getUserContract();
  createUserContract();
  getOpenEventStatus();
  CreateUserEvent();
  closeUserEvent();
  insert_path();
  getPathEventOpen();
  getPathEventClose();
  getcoin();
  getEventOpen();
  getEventClose();
  getuserscore();
}

// Export both functions
module.exports = {
  createMasterContract,
  set_k,
  existContract,
  getUserContract,
  createUserContract,
  getOpenEventStatus,
  CreateUserEvent,
  closeUserEvent,
  insert_path,
  getPathEventOpen,
  getPathEventClose,
  getEventOpen,
  getcoin,
  getEventClose,
  getuserscore
};


//node scripts/compile.js 
//curl -X POST http://localhost:3000/create/contract
//curl -X POST http://localhost:3000/get/contract
//curl -X POST http://localhost:3000/create/event
//curl -X POST http://localhost:3000/close/event
//curl -X POST http://localhost:3000/close/event
//curl -X POST http://localhost:3000/get/event/open
//curl -X POST http://localhost:3000/create/event
//curl -X POST http://localhost:3000/get/event/open
//curl -X POST http://localhost:3000/get/event/close
//curl -X POST http://localhost:3000/get/path/open
//curl -X POST http://localhost:3000/get/path/close
//curl -X POST http://localhost:3000/get/score
//curl -X POST http://localhost:3000/get/coin
//./test

//1000000000000000000n > 523069529879478500n