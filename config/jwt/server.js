


const jwt = require('jsonwebtoken');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
var web3_eth_tx = require('./scripts/notls/web3_eth_tx');
var monetiza = require('./scripts/notls/monetizatest');
const JSONStream = require('JSONStream');
var ethers = require('ethers');
const { getAddress } = require("ethers");
const Web3 = require('web3');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const privateKey = fs.readFileSync('./privateRSAKey.pem');

const mongoose = require('mongoose');


const ObdDataSchema = new mongoose.Schema({
    unit: String,
    title: String,
    response: String,
});

const UserDataItemSchema = new mongoose.Schema({
    pid: String,
    obddata: ObdDataSchema,
});

const UserDataSchema = new mongoose.Schema({
    isOnline: String,
    signature: String,
    userdata: [UserDataItemSchema],
    time: String,
    acc: {
        x: String,
        y: String,
        z: String,
        unit: String,
    },
    pos: {
        long: String,
        lat: String,
    },
    processada: String,
});

const DataItemSchema = new mongoose.Schema({
    vin: String,
    userdata: UserDataSchema,
});


const RecordSchema = new mongoose.Schema({
    Data: String,
    wallet: String,
    data: [DataItemSchema],
});

const contract = new mongoose.Schema({
    add: String,
    wallet: String,
    volume: Number
});

const uservalues = new mongoose.Schema({
    wallet: String,
    vin: String,
    usertank: Number
});



const owner_contract = new mongoose.Schema({
    add: String,
});

const avaible = new mongoose.Schema({
    private: String,
});

//implementar uma verificação para evitar ataque ? Sanetizar as informações que chegam pela req

//cria contrato do usuario
//flutter handle 
//console.log(req.body.wallet)
app.post('/create/contract', async (req, res) => {
    try {
        const Record = mongoose.model('Record', uservalues);
        console.log(req.body)
        const search = await Record.find({ wallet: req.body.wallet });
        console.log(search)

        if (search === undefined || search.length == 0) {
            console.log("não achou")
            const record = new Record(req.body);
            await record.save();
            owners = await get_constract();
            main_contract = owners[0];
            const publicAddress = getAddress(req.body.wallet);
            await monetiza.createUserContract(main_contract.add, publicAddress);
            res.status(200).json('Contrato criado com sucesso');
        } else {
            res.status(400).json({ Existe });
        }

    } catch (err) {
        console.log(err.message);
        res.status(400).json({ error: err.message });
    }

});

app.post('/get/user', async (req, res) => {
    try {
        const Record = mongoose.model('Record', uservalues);
        const search = await Record.find({ wallet: req.body.wallet });

        if (search === undefined || search.length == 0) {
            res.status(404).json('Não existe');
        } else {
            console.log(search);
            res.status(200).json('Existe');
        }

    } catch (err) {
        console.log(err.message);
        res.status(400).json({ error: err.message });
    }
});

//atualiza informações do usuario
app.post('/post/updateuser', async (req, res) => {
    try {
        const Record = mongoose.model('Record', uservalues);
        const search = await Record.find({ wallet: req.body.wallet });

        if (search === undefined || search.length == 0) {
            res.status(404).json('Não existe');
        } else {
            const response = await Record.findOneAndUpdate({ wallet: req.body.wallet }, { $set: { vin: req.body.vin, usertank: req.body.usertank } }, { new: true });
            console.log(response)
            res.status(200).json('Existe');
        }

    } catch (err) {
        console.log(err.message);
        res.status(400).json({ error: err.message });
    }
});


//recupera contrato do usuario
app.post('/get/contract', async (req, res) => {
    owners = await get_constract();
    main_contract = owners[0];
    console.log(owners)
    const publicAddress = getAddress(req.body.wallet);

    const Record = mongoose.model('Record', uservalues);
    //console.log(req.body)
    const search = await Record.find({ wallet: req.body.wallet });
    //console.log(search)


    if (search === undefined || search.length == 0) {
        return res.status(404).json('Usuario não existe');

    } else {

        if (await monetiza.existContract(main_contract.add, publicAddress)) {

            resp = await monetiza.getUserContract(main_contract.add, publicAddress);
            res.status(200).json(resp);
            //executar um rotina para fechar contrato
        } else {
            res.status(404).json('Não existe contrato');
        }
    }
});


app.get('/get/users', async (req, res) => {

    try {

        owners = await get_constract();
        main_contract = owners[0];
        resp = await monetiza.getusers(main_contract.add);


        if (resp != "Não existem usuarios" && listuser.length > 0) {

            console.log(resp)
            res.status(200).json(resp);
        }
        else {
            console.log(resp)
            res.status(401).json(resp)
        }

    } catch (error) {
        console.error('Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

});

//plataform handle
//cria evento ligado a um contrato do usuario
app.post('/create/event', async (req, res) => {
    owners = await get_constract();
    main_contract = owners[0];

    const Record = mongoose.model('Record', uservalues);
    //console.log(req.body)
    const search = await Record.find({ wallet: req.body.wallet });
    //console.log(search)

    if (search === undefined || search.length == 0) {
        res.status(404).json('Usuario não existe');

    } else {


        const data = {
            vin: search[0].vin,
            t: new Date().toLocaleString('en-GB'),
            fuel_b: req.body.data.fuel_b,
            abastecimento: req.body.data.abastecimento,
            usertank: search[0].usertank
        };



        const WalletAvaliable = mongoose.model('WalletAvaliable', avaible);
        const searchwalletavaliable = await WalletAvaliable.find();

        if (searchwalletavaliable === undefined || searchwalletavaliable.length == 0) {

            console.log("Não existe carteira avaliable");
            res.status(404).json('Não existe carteira avaliable');

        } else {
            console.log(searchwalletavaliable[0].private)
            let wallet = new ethers.Wallet(searchwalletavaliable[0].private);
            const publicAddress = getAddress(req.body.wallet);
            resp = await monetiza.getuserscore(main_contract.add, publicAddress);
            const decimals = 18; // depende do token
            const weiValue = await ethers.parseUnits("1", decimals);


            await web3_eth_tx.main(wallet.address, weiValue);


            console.log("existe chave avaliable");

            console.log(data, main_contract.add, publicAddress)
            if (await monetiza.CreateUserEvent(data, main_contract.add, publicAddress)) {
                return res.status(200).json('Evento criado com sucesso');
            } else {
                return res.status(404).json('Problemas na criação do evento');
            }
        }
        return res.status(404).json('Problemas na criação do evento');
    }





});


//usuario e posto
//fecha evento ligado a um contrato do usuario
app.post('/close/event', async (req, res) => {

    owners = await get_constract();
    main_contract = owners[0];
    const publicAddress = getAddress(req.body.wallet);

    const Record = mongoose.model('Record', uservalues);
    //console.log(req.body)
    const search = await Record.find({ wallet: req.body.wallet });
    //console.log(search)


    if (search === undefined || search.length == 0) {
        return res.status(404).json('Usuario não existe');

    } else {

        const Record = mongoose.model('Record', uservalues);
        //console.log(req.body)
        const search = await Record.find({ wallet: req.body.wallet });
        //console.log(search)


        if (search === undefined || search.length == 0) {
            return res.status(404).json('Usuario não existe');

        } else {

            await monetiza.closeUserEvent(main_contract.add, publicAddress);
            res.status(200).json('Evento fechado');
        }
    }
});


//recupera evento em aberto ligado a um contrato do usuario
app.post('/get/event/open', async (req, res) => {
    owners = await get_constract();
    main_contract = owners[0];
    const publicAddress = getAddress(req.body.wallet);

    const Record = mongoose.model('Record', uservalues);
    //console.log(req.body)
    const search = await Record.find({ wallet: req.body.wallet });
    //console.log(search)


    if (search === undefined || search.length == 0) {
        return res.status(404).json('Usuario não existe');

    } else {

        resp = await monetiza.getEventOpen(main_contract.add, publicAddress);

        if (resp != "contrato não existente") {
            if (resp != "Não existe evento aberto") {

                const replacer = (key, value) => {
                    if (typeof value === 'bigint') {
                        return value.toString();
                    }
                    return value;
                };
                const jsonString = JSON.stringify(resp, replacer);
                res.status(200).send(jsonString);
            } else {
                res.status(401).json(resp);
            }

        } else {
            res.status(401).json(resp);
        }
    }


});


//recupera evento fechado ligado a um contrato do usuario
app.post('/get/event/close', async (req, res) => {

    owners = await get_constract();
    main_contract = owners[0];
    const publicAddress = getAddress(req.body.wallet);


    const Record = mongoose.model('Record', uservalues);
    //console.log(req.body)
    const search = await Record.find({ wallet: req.body.wallet });
    //console.log(search)


    if (search === undefined || search.length == 0) {
        return res.status(404).json('Usuario não existe');

    } else {

        resp = await monetiza.getEventClose(main_contract.add, publicAddress);
        // Set headers for streaming

        if (resp != "Não existe evento fechado") {

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Transfer-Encoding', 'chunked');

            // Create a transform stream that handles bigint conversion
            const transformStream = JSONStream.stringify();

            // Pipe the transform stream to the response
            transformStream.pipe(res);
            //console.log(resp);



            const replacer = (key, value) => {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                return value;
            };

            // Process each item and stream it
            for (const item of resp) {
                // Convert bigint to string for each item
                const serializableItem = JSON.parse(JSON.stringify(item, (key, value) => {
                    return typeof value === 'bigint' ? value.toString() : value;
                }));

                transformStream.write(serializableItem);
                console.log(serializableItem)
            }



            // End the stream
            transformStream.end();

        } else {

            res.status(401).json(resp);
        }
    }
});

//recuperar o array de dados no mongo 
//recupera dados veiculares de um evento aberto  ligado a um contrato do usuario
app.post('/get/path/open', async (req, res) => {

    const Record = mongoose.model('Record', uservalues);
    //console.log(req.body)
    const search = await Record.find({ wallet: req.body.wallet });
    //console.log(search)


    if (search === undefined || search.length == 0) {
        return res.status(404).json('Usuario não existe');

    } else {



        owners = await get_constract();
        main_contract = owners[0];
        const publicAddress = getAddress(req.body.wallet);


        resp = await monetiza.getPathEventOpen(main_contract.add, publicAddress);
        // Set headers for streaming
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Create a transform stream that handles bigint conversion
        const transformStream = JSONStream.stringify();



        i = 0;
        var newitem = []
        //console.log(resp)


        if (resp.listtrajetos.length > 0) {


            for (const hash of resp.listtrajetos) {

                listlatlong = []

                //console.log(hash)

                const Record = mongoose.model('Recordpath', RecordSchema);
                const id = ethers.decodeBytes32String(hash.storedHash);

                const record = await Record.findById(id);
                //console.log(record.toString() )
                for (latlong of record.data) {
                    //console.log(latlong.userdata.pos);
                    listlatlong.push(latlong.userdata.pos)
                }


                resp["listtrajetos"][i]["pos"] = listlatlong
                i++
                //item.listtrajetos.push(listlatlong)

                // console.log(item)


            }

            // Pipe the transform stream to the response
            transformStream.pipe(res);
            transformStream.write(resp);
            // End the stream
            transformStream.end();

            //res.status(200).json("Trajeto aberto enviado");
        } else {
            res.status(401).json("Não há trajetos abertos");
        }
    }


});




//recuperar o array de dados no mongo 
//recupera dados veiculares de eventos fechados  ligado a um contrato do usuario
app.post('/get/path/close', async (req, res) => {
    try {

        const Record = mongoose.model('Record', uservalues);
        //console.log(req.body)
        const search = await Record.find({ wallet: req.body.wallet });
        //console.log(search)


        if (search === undefined || search.length == 0) {
            return res.status(404).json('Usuario não existe');

        } else {
            const publicAddress = getAddress(req.body.wallet);
            owners = await get_constract();
            main_contract = owners[0];

            resp = await monetiza.getPathEventClose(main_contract.add, publicAddress);
            console.log(resp)
            // Set headers for streaming
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Transfer-Encoding', 'chunked');

            // Create a transform stream that handles bigint conversion
            const transformStream = JSONStream.stringify();

            // Pipe the transform stream to the response
            transformStream.pipe(res);

            const replacer = (key, value) => {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                return value;
            };



            // Process each item and stream it
            for (const item of resp) {
                // Convert bigint to string for each item
                var newitem = []

                //console.log(item);
                i = 0;

                for (const hash of item.listtrajetos) {
                    listlatlong = []

                    //console.log(hash)

                    const Record = mongoose.model('Recordpath', RecordSchema);
                    const id = ethers.decodeBytes32String(hash.storedHash);

                    const record = await Record.findById(id);
                    //console.log(record.toString() )
                    for (latlong of record.data) {
                        //console.log(latlong.userdata.pos);
                        listlatlong.push(latlong.userdata.pos)
                    }


                    item["listtrajetos"][i]["pos"] = listlatlong
                    i++
                    newitem = item
                    //item.listtrajetos.push(listlatlong)

                    // console.log(item)


                }


                //console.log(newitem)
                //console.log(serializableItem)
                const serializableItem = JSON.parse(JSON.stringify(newitem, (key, value) => {
                    if (typeof value === 'bigint') {
                        return value.toString();
                    }
                    return value;
                }));


                transformStream.write(serializableItem);


            }

            //const id = ethers.decodeBytes32String(encodedId);
            //const record = await Record.findById(id);

            // End the stream
            transformStream.end();

        }
    } catch (error) {
        console.error('Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

//recupera o score do user ligado a um contrato do usuario
app.post('/get/score', async (req, res) => {
    owners = await get_constract();
    main_contract = owners[0];
    const publicAddress = getAddress(req.body.wallet);

    const Record = mongoose.model('Record', uservalues);
    //console.log(req.body)
    const search = await Record.find({ wallet: req.body.wallet });
    //console.log(search)


    if (search === undefined || search.length == 0) {
        return res.status(404).json('Usuario não existe');

    } else {


        resp = await monetiza.getuserscore(main_contract.add, publicAddress);
        if (resp != false) {
            const replacer = (key, value) => {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                return value;
            };

            const jsonString = JSON.stringify(resp, replacer);
            res.status(200).send(jsonString);

        } else { res.status(404).send("contrato não existente"); }
    }
});

//pagamento de eventos fechados todo. 
//monetiza o user ligado a um contrato do usuario
app.post('/get/coin', async (req, res) => {

    owners = await get_constract();
    main_contract = owners[0];

    const Record = mongoose.model('Record', uservalues);
    //console.log(req.body)
    const search = await Record.find({ wallet: req.body.wallet });
    //console.log(search)


    if (search === undefined || search.length == 0) {
        return res.status(404).json('Usuario não existe');

    } else {


        const WalletAvaliable = mongoose.model('WalletAvaliable', avaible);
        const searchwalletavaliable = await WalletAvaliable.find();

        if (searchwalletavaliable === undefined || searchwalletavaliable.length == 0) {

            console.log("Não existe carteira avaliable");
            return res.status(404).json('Não existe carteira avaliable');

        } else {

            let wallet = new ethers.Wallet(searchwalletavaliable[0].private);


            const publicAddress = getAddress(req.body.wallet);

            resp = await monetiza.getcoin(main_contract.add, publicAddress);
            const replacer = (key, value) => {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                return value;
            };


            if (resp == 0) {

                console.log("sem monetização")
                return res.send("Sem monetização");

            } else {
                const jsonString = JSON.stringify(resp, replacer);

                const decimals = 18; // depende do token
                console.log(resp.toString())
                //const weiValue = await ethers.parseUnits(resp.toString(), decimals);


                const web3 = new Web3("http://validator1/testeu/");
                console.log(Number(resp.toString()))


                accountABalance = web3.utils.fromWei(await web3.eth.getBalance(wallet.address));
                console.log("Account A : " + accountABalance);
                accountBBalance = web3.utils.fromWei(await web3.eth.getBalance(publicAddress));
                console.log("Account B : " + accountBBalance);

                const txn = {
                    nonce: web3.utils.numberToHex(await web3.eth.getTransactionCount(wallet.address)),
                    from: wallet.address,
                    to: publicAddress,
                    value: Number(resp.toString()),  //amount of eth to transfer
                    gasPrice: "0x0", //ETH per unit of gas
                    gasLimit: "0x24A22" //max number of gas units the tx is allowed to use
                };

                console.log("create and sign the txn")
                const signedTx = await web3.eth.accounts.signTransaction(txn, wallet.privateKey);
                console.log("sending the txn")
                const txReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                console.log("tx transactionHash: " + txReceipt.transactionHash);

                //After the transaction there should be some ETH transferred
                accountABalance = web3.utils.fromWei(await web3.eth.getBalance(wallet.address));
                console.log("Account A has an updated balance of: " + accountABalance);
                accountBBalance = web3.utils.fromWei(await web3.eth.getBalance(publicAddress));
                console.log("Account B has an updated balance of: " + accountBBalance);


                return res.status(200).send("Monetizado");


            }



        }



    }




});



app.post('/send/data/vehicle', async (req, res) => {
    const Record = mongoose.model('Recordpath', RecordSchema);
    //console.log(req.body);
    const publicAddress = getAddress(req.body.wallet);

    try {
        const record = new Record(req.body);
        const hash = await record.save();
        console.log(hash._id);
        console.log(record.wallet);
        owners = await get_constract();
        main_contract = owners[0];
        return res.status(200).json(await monetiza.insert_path(hash, record, main_contract.add, publicAddress));
    } catch (err) {
        console.log(err.message);
        return res.status(400).json({ error: err.message });
    }

});


app.post('/receive', (req, res) => {
    console.log(req.body);
    const decimals = 18; // depende do token
    const weiValue = ethers.parseUnits("1", decimals);
    web3_eth_tx.main(req.body.wallet, weiValue);
    return res.status(200).send('Solicitação POST recebida com sucesso!');
});

app.get('/login', (req, res) => {
    const a = {

        "permissions": ["eth:*"],
        "exp": Math.floor(Date.now() / 1000) + (60 * 60)
    }

    const token = jwt.sign(
        a,
        privateKey,
        { algorithm: 'RS256' }                  // or 'RS256'
    );

    return res.status(200).send({ token });
});

app.get('/admin', (req, res) => {
    const a = {

        "permissions": ["*:*"],
        "exp": Math.floor(Date.now() / 1000) + (60 * 60)
    }

    const token = jwt.sign(
        a,
        privateKey,
        { algorithm: 'RS256' }                  // or 'RS256'
    );

    return res.status(200).send({ token });
});

app.get('/get/sendcontract', async (req, res) => {
    var aux = await monetiza.sendAbi();
    owners = await get_constract();
    main_contract = owners[owners.length - 1];
    sending = {
        "adress": main_contract["add"],
        "abi": aux
    }
    console.log(sending)
    return res.status(200).send(sending)


})


app.get('/', (req, res) => {
    return res.status(200).json('JWT Server is running');
});

async function init() {
    var a = await monetiza.createMasterContract();
    const OwnerContract = mongoose.model('OwnerContract', owner_contract);
    const doc = new OwnerContract({ add: a });
    const result = await doc.save();
}

async function createsendcontract() {
    var a = await monetiza.createContractSender();
    const OwnerContract = mongoose.model('OwnerContract', owner_contract);
    const doc = new OwnerContract({ add: a });
    const result = await doc.save();
}

async function get_constract() {
    const OwnerContract = mongoose.model('OwnerContract', owner_contract);
    const owners = await OwnerContract.find();
    return owners;
}

async function createwallettransaction() {

    let randomWallet = ethers.Wallet.createRandom();
    console.log(randomWallet.privateKey);
    //console.log(randomWallet)


    const WalletAvaliable = mongoose.model('WalletAvaliable', avaible);
    const search = await WalletAvaliable.find();


    if (search === undefined || search.length == 0) {
        const doc = new WalletAvaliable({ private: randomWallet.privateKey });
        const result = await doc.save();
        console.log("Carteira criada e salva");

    } else {
        console.log(search);
        console.log("existe chave avaliable");
    }


}


app.listen(3000, async () => {
    const uri = 'mongodb://admin:password@mongodb:27017/monetiza?authSource=admin';

    //0xC9C913c8c3C1Cd416d80A0abF475db2062F161f6
    // Connect to MongoDB
    mongoose.connect(uri)
        .then(() => console.log("Connected to MongoDB 🚀"))
        .catch(err => console.error("Connection error:", err));

    owners = await get_constract();

    if (owners.length == 0) {
        await init();
        await createsendcontract();
        await createwallettransaction();
        owners = await get_constract();
        main_contract = owners[0];
        monetiza.set_k(main_contract.add, 3);
    } else {
        owners = await get_constract();
        main_contract = owners[0];
        // con
        //monetiza.set_k(main_contract.add, 3);
    }
    //criar contrato, retornar e salvar no mongodb  
    console.log('JWT Server listening on port 3000');
});

