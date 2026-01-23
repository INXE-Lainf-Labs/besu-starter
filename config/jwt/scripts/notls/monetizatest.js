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


const contractJsonPath_send = path.resolve(__dirname, '../', 'contracts', 'SendEther.json');
const contractJson_send = JSON.parse(fs.readFileSync(contractJsonPath_send));
const contractAbi_send = contractJson_send.abi;
const contractBytecode_send = contractJson_send.evm.bytecode.object


async function createContractSender() {
  //console.log("Contract bytecode size:", contractBytecode.length / 2, "bytes");
  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);

  // Deploy MonetizaFactory
  const factory = new ethers.ContractFactory(contractAbi_send, contractBytecode_send, wallet);
  //console.log(wallet.address);
  const feeData = await provider.getFeeData();
  const contract = await factory.deploy();
  // The c

  const deployed = await contract.waitForDeployment();
  console.log("SendEther deployed at:", deployed.target);
  return deployed.target;
}

async function sendAbi() {
  return contractAbi_send;
}

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

async function getusers(mastercontract) {

  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);
  const readOnlyContract = new ethers.Contract(mastercontract, contractAbi, provider);
  const writableContract = readOnlyContract.connect(wallet);
  // Get events from block 0 to latest

  const latestBlock = await provider.getBlockNumber();
  const step = 5000; // chunk size
  let fromBlock = 0;
  let toBlock = step;

  listuser = []

  while (fromBlock <= latestBlock) {


    if (toBlock > latestBlock) {
      toBlock = latestBlock;
    }
    const contracts = await writableContract.queryFilter("ContractCreated", fromBlock, toBlock);

    for (const contract of contracts) {
      listuser.push(contract.args.owner)

    }

    // Move to the next block range
    fromBlock = toBlock + 1;
    toBlock = fromBlock + step;
  }
  if (listuser.length > 0) {
    return listuser
  } else { return ("Não existem usuarios") }



}

async function existContract(mastercontract, wallet_user) {
  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);
  const readOnlyContract = new ethers.Contract(mastercontract, contractAbi, provider);
  const writableContract = readOnlyContract.connect(wallet);
  // Get events from block 0 to latest


  const latestBlock = await provider.getBlockNumber();
  const step = 5000; // chunk size
  let fromBlock = 0;
  let toBlock = step;

  userlist = []

  const user = {
    wallet: "",
    addcontract: "",
  }


  while (fromBlock <= latestBlock) {


    if (toBlock > latestBlock) {
      toBlock = latestBlock;
    }
    const contracts = await writableContract.queryFilter("ContractCreated", fromBlock, toBlock);

    for (const contract of contracts) {

      //console.log(contract.args.owner.toLowerCase(), wallet_user)
      if (contract.args.owner == wallet_user) {

        return true;
      }
    }

    // Move to the next block range
    fromBlock = toBlock + 1;
    toBlock = fromBlock + step;
  }

  return false;

}



async function getUserContract(mastercontract, wallet_user) {
  const provider = new ethers.JsonRpcProvider(host);
  const wallet = new ethers.Wallet(accountPrivateKey, provider);


  const readOnlyContract = new ethers.Contract(mastercontract, contractAbi, provider);
  const writableContract = readOnlyContract.connect(wallet);
  // Get events from block 0 to latest



  const latestBlock = await provider.getBlockNumber();
  const step = 5000; // chunk size
  let fromBlock = 0;
  let toBlock = step;


  while (fromBlock <= latestBlock) {


    if (toBlock > latestBlock) {
      toBlock = latestBlock;
    }
    const contracts = await writableContract.queryFilter("ContractCreated", fromBlock, toBlock);



    for (const contract of contracts) {
      //console.log(contract)
      if (contract.args.owner == wallet_user) {
        return contract;
      }
    }

    // Move to the next block range
    fromBlock = toBlock + 1;
    toBlock = fromBlock + step;



  }

  return false;


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


      const raw = await writableContract.getEvents(help.args.id);
      const [
        idEvent,
        contractAddress,
        vin,
        date,
        fuel_b,
        fuel_e,
        abastecimento,
        usertank
      ] = raw;



      // Format BigInt values into decimal strings:
      const decimals = 18;
      const formatted = {
        idEvent,
        contractAddress,
        vin,
        date,
        fuel_b: parseFloat(ethers.formatUnits(fuel_b, decimals)).toFixed(2),
        fuel_e: parseFloat(ethers.formatUnits(fuel_e, decimals)).toFixed(2),
        abastecimento: parseFloat(ethers.formatUnits(abastecimento, decimals)).toFixed(2),
        usertank: parseFloat(ethers.formatUnits(usertank, decimals)).toFixed(2),
      };


      return formatted
    } else {
      console.log("Não existe evento aberto");
      return "Não existe evento aberto"
    }


  } else {
    console.log("contrato não existente");
    return "contrato não existente"
  }
}


//recupera trajetos em eventos fechados
async function getEventClose(mastercontract, wallet_user) {

  const provider = new ethers.JsonRpcProvider(host);

  const wallet = new ethers.Wallet(accountPrivateKey, provider);

  helpadd = await getUserContract(mastercontract, wallet_user)
  console.log(helpadd.args);

  const contractJsonPath2 = path.resolve(__dirname, '../', 'contracts', 'Monetiza.json');
  const contractJson2 = JSON.parse(fs.readFileSync(contractJsonPath2));
  const contractAbi2 = contractJson2.abi;

  const monetizaContract = new ethers.Contract(helpadd.args[1], contractAbi2, provider);

  const latestBlock = await provider.getBlockNumber();
  const step = 5000; // chunk size
  let fromBlock = 0;
  let toBlock = step;
  aux = [];


  while (fromBlock <= latestBlock) {


    if (toBlock > latestBlock) {
      toBlock = latestBlock;
    }
    const logs = await monetizaContract.queryFilter("EventRegistered", fromBlock, toBlock);

    for (const log of logs) {


      if (log.args.wallet == wallet_user) {
        const decimals = 18;
        helpaux = {
          idEvent: log.args.idEvent,
          wallet: log.args.wallet,
          contractAddress: log.args.contractAddress,
          vin: log.args.vin,
          date: log.args.t,
          fuel_b: parseFloat(ethers.formatUnits(log.args.fuel_b, decimals)).toFixed(2),
          fuel_e: parseFloat(ethers.formatUnits(log.args.fuel_e, decimals)).toFixed(2),
          abastecimento: parseFloat(ethers.formatUnits(log.args.abastecimento, decimals)).toFixed(2),
          usertank: parseFloat(ethers.formatUnits(log.args.usertank, decimals)).toFixed(2),
        };
        aux.push(helpaux)
      }
    }

    // Move to the next block range
    fromBlock = toBlock + 1;
    toBlock = fromBlock + step;
  }

  if (aux.length > 0) {
    return aux
  } else { return "Não existe evento fechado" }


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


      const raw = await writableContract.getpath(help.args.id);
      const decimals = 18;

      // Extract struct fields
      const { contractAddress, listtrajetos, idEvent } = raw;


      // Format the trajetos array
      const trajetosFormatted = listtrajetos.map((trajeto) => {
        return {
          storedHash: trajeto.storedHash,
          dist: parseFloat(ethers.formatUnits(trajeto.dist, decimals)).toFixed(2),
          fuel: parseFloat(ethers.formatUnits(trajeto.fuel, decimals)).toFixed(2),
          time: parseFloat(ethers.formatUnits(trajeto.time, decimals)).toFixed(2),
          timeless: parseFloat(ethers.formatUnits(trajeto.timeless, decimals)).toFixed(2),
        };
      });

      //console.log(trajetosFormatted)

      const formatted = {
        contractAddress,
        idEvent: idEvent.toString(), // convert BigInt if needed
        listtrajetos: trajetosFormatted,
      };


      return formatted;

    } else {
      list = {
        contractAddress: "",
        idEvent: "", // convert BigInt if needed
        listtrajetos: [],
      }
      return list;
    }

  } else {
    list = {
      contractAddress: "",
      idEvent: "", // convert BigInt if needed
      listtrajetos: [],
    }
    return list;
  }

}

//recupera trajetos em eventos fechados
async function getPathEventClose(mastercontract, wallet_user) {


  const provider = new ethers.JsonRpcProvider(host);

  const wallet = new ethers.Wallet(accountPrivateKey, provider);

  helpadd = await getUserContract(mastercontract, wallet_user)

  const contractJsonPath2 = path.resolve(__dirname, '../', 'contracts', 'Monetiza.json');
  const contractJson2 = JSON.parse(fs.readFileSync(contractJsonPath2));
  const contractAbi2 = contractJson2.abi;

  const monetizaContract = new ethers.Contract(helpadd.args[1], contractAbi2, provider);



  const latestBlock = await provider.getBlockNumber();
  const step = 5000; // chunk size
  let fromBlock = 0;
  let toBlock = step;
  aux = [];



  while (fromBlock <= latestBlock) {

    if (toBlock > latestBlock) {
      toBlock = latestBlock;
    }
    const logs = await monetizaContract.queryFilter("TrajetosRegistered", fromBlock, toBlock);

    for (const log of logs) {

      if (log.args.wallet == wallet_user) {


        const decimals = 18;



        // Format the trajetos array
        const trajethelpauxosFormatted = log.args.listtrajetos.map((trajeto) => {
          return {
            storedHash: trajeto.storedHash,
            dist: parseFloat(ethers.formatUnits(trajeto.dist, decimals)).toFixed(2).toString(),
            fuel: parseFloat(ethers.formatUnits(trajeto.fuel, decimals)).toFixed(2).toString(),
            time: parseFloat(ethers.formatUnits(trajeto.time, decimals)).toFixed(2).toString(),
            timeless: parseFloat(ethers.formatUnits(trajeto.timeless, decimals)).toFixed(2).toString(),

          };
        });

        const formatted = {
          wallet: log.args.wallet,
          contractAddress: log.args.contractAddress,
          idevent: log.args.idEvent,
          listtrajetos: trajethelpauxosFormatted,
          value: parseFloat(ethers.formatUnits(log.args.value, decimals)).toFixed(2).toString(),
        };
        aux.push(formatted)

      }
    }

    // Move to the next block range
    fromBlock = toBlock + 1;
    toBlock = fromBlock + step;
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
  console.log(exist);

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
      //console.log(receipt);
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

    help1 = await writableContract.getscore(help.args.id);
    const decimals = 18; // depende do token
    help2 = []
    help2[0] = parseFloat(ethers.formatUnits(help1[0].toString(), decimals)).toFixed(2);
    help2[1] = parseFloat(ethers.formatUnits(help1[1].toString(), decimals)).toFixed(2);
    help2[2] = parseFloat(ethers.formatUnits(help1[2].toString(), decimals)).toFixed(2);
    console.log(help2)
    return help2
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


    const decimals = 18; // depende do token
    const valuecon = parseFloat(ethers.formatUnits(value, decimals)).toFixed(2);

    if (valuecon > 0) {

      const pay = await writableContract.sendViaCall(wallet_user,
        {
          value: value,
          gasLimit: 100000 // Add explicit gas limit
        });

      var receipt = await pay.wait();
      //console.log(receipt)


      const txNew = await writableContract.setcoin(help.args.id);
      receipt = await txNew.wait();

      return value;
    }
    return 0.00;

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

      eventuser = await getEventOpen(mastercontract, wallet_user)
      const data = eventuser;
      listPoints = []
      listFuel = []
      listTime = []



      console.log("vin contrato")
      console.log(eventuser.vin)
      console.log("vin dados")
      console.log(tuple[0].uservehicle.vin)

      if (tuple[0].uservehicle.vin == data.vin) {


        for (i = 0; i < tuple.length; i++) {



          if (parseFloat(tuple[i].uservehicle.userdata.pos.lat) != 0.0 && parseFloat(tuple[i].uservehicle.userdata.pos.long) != 0.0) {
            point = {
              lat: tuple[i].uservehicle.userdata.pos.lat,
              lng: tuple[i].uservehicle.userdata.pos.long
            }

            listPoints.push(point)
          }



          listTime.push(tuple[i].uservehicle.userdata.time)

          for (j = 0; j < tuple[i].uservehicle.userdata.userdata.length; j++) {

            if (tuple[i].uservehicle.userdata.userdata[j].pid = "01 2F") {

              listFuel.push(parseFloat(tuple[i].uservehicle.userdata.userdata[j].obddata.response))

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

        console.log("tempo capturado")
        console.log(listtModify)

         console.log("comb capturado")
        console.log(listFuel)


        const regression = new rl.SimpleLinearRegression(listtModify, listFuel);

        console.log("comb calculado")
        console.log(regression)


        const json = regression.toJSON();
        const loaded = rl.SimpleLinearRegression.load(json);

        console.log("comb JSON")
        console.log(loaded)

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

        console.log("lista de consumo")
        console.log(newlistFuel)

        console.log("comb final")
        console.log(fuel);

        fuel = (fuel / 100) * 20;

        console.log("porcentagem")
        console.log(fuel);


        const decimals = 18; // depende do token
        const dm = ethers.parseUnits(distmeters.toFixed(6).toString(), decimals);
        const f = ethers.parseUnits(fuel.toFixed(6).toString(), decimals);
        const ts = ethers.parseUnits(timef.toFixed(6).toString(), decimals);
        const tl = ethers.parseUnits(timeli.toFixed(6).toString(), decimals);


        console.log("tratado")
        console.log(f);


        const txNew = await writableContract.createTrajeto(help.args.id, wallet_user, help.args.contractAddress, hashgenerate, dm, f, ts, tl);

        const receipt = await txNew.wait();
        console.log(receipt);
        return ("dados veiculares inseridos")
      } else {
        console.log("vin diferente")
        return ("vin diferente")
      }

    } else {
      console.log("Não existe evento em aberto")
      return ("Não existe evento em aberto")
    }



  } else {
    console.log("contrato não existente");
    return ("contrato não existente")
  }







}

if (require.main === module) {
  createContractSender();
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
  getusers();
  sendAbi();
}

// Export both functions
module.exports = {
  createContractSender,
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
  getuserscore,
  getusers,
  sendAbi
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
//./test.sh
//curl -X POST http://localhost:3000/get/event/close
//curl -X POST http://localhost:3000/get/path/open
//curl -X POST http://localhost:3000/get/path/close
//curl -X POST http://localhost:3000/get/score
//curl -X POST http://localhost:3000/get/coin


//1000000000000000000n > 523069529879478500n

//http://192.168.100.1
//1GGCS19X7V8654322
//0x4a18fc622010b2e963d29a523db5497e426b3258