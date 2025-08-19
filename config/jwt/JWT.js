


const jwt = require('jsonwebtoken');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
var web3_eth_tx = require('./scripts/notls/web3_eth_tx');

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
    data: [DataItemSchema],
});





app.post('/create_contract', (req, res) => {
    
    res.send('Solicitação POST recebida com sucesso!');
});

/*
const trajetodataSchema = new mongoose.Schema({
  storedHash: { type: String, required: true },  // Store bytes32 as hex string
  dist: { type: Number, required: true },        // meters
  fuel: { type: Number, required: true },        // percent
  time: { type: Number, required: true },        // seconds
  timeless: { type: Number, required: true }     // seconds
});
*/

const Record = mongoose.model('Record', RecordSchema);

app.post('/receive', (req, res) => {
    web3_eth_tx.main(req.body);
    res.send('Solicitação POST recebida com sucesso!');
});

app.post('/vehicledata', async (req, res) => {
    //console.log(req.body);
    console.log(JSON.stringify(req.body, null, 2));
    // MongoDB URI (replace with yours if needed)
    const uri = 'mongodb://admin:password@localhost:27017/monetiza?authSource=admin';
    //0xC9C913c8c3C1Cd416d80A0abF475db2062F161f6
    // Connect to MongoDB
    mongoose.connect(uri)
        .then(() => console.log("Connected to MongoDB 🚀"))
        .catch(err => console.error("Connection error:", err));

    try {
        const record = new Record(req.body);
        const saved = await record.save();
        console.log("foi");
        console.log(record.wallet);
        web3_eth_tx.main(record.wallet);   
        res.status(201).json(saved);
    } catch (err) {
        console.log(err.message);
        res.status(400).json({ error: err.message });
    }

});

app.post('/createcontract', async (req,res)=>{

});

app.post('/close', async (req,res)=>{

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
    res.send('JWT Server is running');
});


app.listen(3000, () => {
    console.log('JWT Server listening on port 3000');
});


/*
   struct Tupla {
        string t; // timestamp
        string pos; // posição
        string comb; // combustível
    }

    struct Trajeto {
        Tupla[] tuplas; // sequência de tuplas
        uint completudel;
        uint frequencial;

    }

*/