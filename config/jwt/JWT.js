


const jwt = require('jsonwebtoken');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
var web3_eth_tx = require('./scripts/notls/web3_eth_tx');
var monetiza = require('./scripts/notls/monetizatest');
const JSONStream = require('JSONStream');


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


const owner_contract = new mongoose.Schema({
    add: String,
});



//cria contrato do usuario
app.post('/create/contract', async (req, res) => {
    owners = await get_constract();
    main_contract = owners[owners.length - 1];
    await monetiza.createUserContract(main_contract.add, "0x4288201baC903F84648E81A07F793C9E7d893692");
    res.send('Contrato criado com sucesso');
});


//recupera contrato do usuario
app.post('/get/contract', async (req, res) => {
    owners = await get_constract();
    main_contract = owners[owners.length - 1];

    if (await monetiza.existContract(main_contract.add, "0x4288201baC903F84648E81A07F793C9E7d893692")) {

        resp = await monetiza.getUserContract(main_contract.add, "0x4288201baC903F84648E81A07F793C9E7d893692");
        res.json(resp);
        //executar um rotina para fechar contrato
    } else {
        res.send('Não existe contrato');
    }

});


//cria evento ligado a um contrato do usuario
app.post('/create/event', async (req, res) => {
    owners = await get_constract();
    main_contract = owners[owners.length - 1];
    const data = {
        vin: "1GBJC34R9XF017297",
        t: new Date().toLocaleString('en-GB'),
        fuel_b: 30,
        abastecimento: 1,
        usertank: 40
    };
    if (await monetiza.CreateUserEvent(data, main_contract.add, "0x4288201baC903F84648E81A07F793C9E7d893692")) {
        res.send('Evento criado com sucesso');
    } else {
        res.send('Problemas na criação do evento');
    }

});



//fecha evento ligado a um contrato do usuario
app.post('/close/event', async (req, res) => {

    owners = await get_constract();
    main_contract = owners[owners.length - 1];
    await monetiza.closeUserEvent(main_contract.add, "0x4288201baC903F84648E81A07F793C9E7d893692");
    res.send('Evento fechado');
});


//recupera evento em aberto ligado a um contrato do usuario
app.post('/get/event/open', async (req, res) => {
    owners = await get_constract();
    main_contract = owners[owners.length - 1];
    resp = await monetiza.getEventOpen(main_contract.add, "0x4288201baC903F84648E81A07F793C9E7d893692");

    const replacer = (key, value) => {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
    };

    const jsonString = JSON.stringify(resp, replacer);
    res.send(jsonString);

});


//recupera evento fechado ligado a um contrato do usuario
app.post('/get/event/close', async (req, res) => {

    owners = await get_constract();
    main_contract = owners[owners.length - 1];
    resp = await monetiza.getEventClose(main_contract.add, "0x4288201baC903F84648E81A07F793C9E7d893692");
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
        const serializableItem = JSON.parse(JSON.stringify(item, (key, value) => {
            return typeof value === 'bigint' ? value.toString() : value;
        }));

        transformStream.write(serializableItem);
    }

    // End the stream
    transformStream.end();

});


//recupera dados veiculares de um evento aberto  ligado a um contrato do usuario
app.post('/get/path/open', async (req, res) => {
    owners = await get_constract();
    main_contract = owners[owners.length - 1];
    resp = await monetiza.getPathEventOpen(main_contract.add, "0x4288201baC903F84648E81A07F793C9E7d893692");
    // Set headers for streaming
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Create a transform stream that handles bigint conversion
    const transformStream = JSONStream.stringify();

    // Pipe the transform stream to the response
    transformStream.pipe(res);


    transformStream.write(resp);

    // End the stream
    transformStream.end();
});


//recuperar o array de dados no mongo 
//recupera dados veiculares de eventos fechados  ligado a um contrato do usuario
app.post('/get/path/close', async (req, res) => {
    try {
        owners = await get_constract();
        main_contract = owners[owners.length - 1];
        resp = await monetiza.getPathEventClose(main_contract.add, "0x4288201baC903F84648E81A07F793C9E7d893692");

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
            const serializableItem = JSON.parse(JSON.stringify(item, (key, value) => {
                return typeof value === 'bigint' ? value.toString() : value;
            }));

            transformStream.write(serializableItem);
        }

        // End the stream
        transformStream.end();
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
    main_contract = owners[owners.length - 1];
    resp = await monetiza.getuserscore(main_contract.add, "0x4288201baC903F84648E81A07F793C9E7d893692");
    const replacer = (key, value) => {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
    };

    const jsonString = JSON.stringify(resp, replacer);
    res.send(jsonString);
});


//monetiza o user ligado a um contrato do usuario
app.post('/get/coin', async (req, res) => {
    owners = await get_constract();
    main_contract = owners[owners.length - 1];
    resp = await monetiza.getcoin(main_contract.add, "0x4288201baC903F84648E81A07F793C9E7d893692");
    const replacer = (key, value) => {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
    };

    const jsonString = JSON.stringify(resp, replacer);
    res.send(jsonString);

});



app.post('/send/data/vehicle', async (req, res) => {
    const Record = mongoose.model('Record', RecordSchema);


    try {
        const record = new Record(req.body);
        const hash = await record.save();
        //console.log(hash._id);
        //console.log(record.wallet);
        owners = await get_constract();
        main_contract = owners[owners.length - 1];
        await monetiza.insert_path(hash, record, main_contract.add, "0x4288201baC903F84648E81A07F793C9E7d893692");
        res.status(201).json({ "mensagem": "dados veiculares inseridos" });
    } catch (err) {
        console.log(err.message);
        res.status(400).json({ error: err.message });
    }

});

app.post('/send/data/market', async (req, res) => {

    try {

        


    } catch (err) {
        console.log(err.message);
    }
});


app.post('/receive', (req, res) => {
    //console.log(req.body);
    web3_eth_tx.main(req.body);
    res.send('Solicitação POST recebida com sucesso!');
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

    res.send({ token });
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

    res.send({ token });
});


app.get('/', (req, res) => {
    res.json('JWT Server is running');
});

async function init() {
    var a = await monetiza.createMasterContract();
    const OwnerContract = mongoose.model('OwnerContract', owner_contract);
    const doc = new OwnerContract({ add: a });
    const result = await doc.save();
}

async function get_constract() {
    const OwnerContract = mongoose.model('OwnerContract', owner_contract);
    const owners = await OwnerContract.find();
    return owners;
}


app.listen(3000, async () => {
    const uri = 'mongodb://admin:password@localhost:27017/monetiza?authSource=admin';
    //0xC9C913c8c3C1Cd416d80A0abF475db2062F161f6
    // Connect to MongoDB
    mongoose.connect(uri)
        .then(() => console.log("Connected to MongoDB 🚀"))
        .catch(err => console.error("Connection error:", err));

    owners = await get_constract();
    if (owners.length == 0) {
        await init();
        owners = await get_constract();
        main_contract = owners[owners.length - 1];
        monetiza.set_k(main_contract.add, 3);
    } else {
        owners = await get_constract();
        main_contract = owners[owners.length - 1];
        // con
        //monetiza.set_k(main_contract.add, 3);
    }
    //criar contrato, retornar e salvar no mongodb  
    console.log('JWT Server listening on port 3000');
});

