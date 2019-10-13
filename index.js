const gpio = require('rpi-gpio');
const http = require('http');
const https = require('https');
const express = require('express');
const fs = require('fs');
const sleep = require('sleep-promise');
const bodyParser = require('body-parser');

const httpsPort = 8443;
const coinPrice = 2;
const coinPin = 12;
const servicePin = 11;

const httpsOptions = {
    cert: fs.readFileSync('./chain.pem'),
    key: fs.readFileSync('./key.pem')
};

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/arcade', (req, res) => {
    console.log('level=info, msg="incoming request" body="%s"', JSON.stringify(req.body));

    try {
        var payload = JSON.parse(req.body.payload);
        var amount = Math.floor(payload.amount / 100 / coinPrice);
        insertCoins(amount);
    } catch(err) {
        console.log(err);
    } finally {
        res.send('thanks!');
    }
});

gpio.promise.setup(coinPin, gpio.DIR_LOW)
    .then(() => {
        return gpio.promise.setup(servicePin, gpio.DIR_LOW);
    })
    .then(() => {
        https.createServer(httpsOptions, app)
            .listen(httpsPort);
        console.log('level=info, msg="https ready"');
    });

async function insertCoins(coins) {
    console.log('level=info, msg="inserting %s coins"', coins);
    for (let coin = 0; coin < coins; coin++) {
        await gpio.promise
            .write(coinPin, true)
            .then(sleep(100))
            .then(() => {
                return gpio.promise.write(coinPin, false);
             })
            .then(() => {
                console.log('level=info, msg="coin %s of %s inserted"', coin + 1, coins);
            })
            .then(sleep(200))
            .catch((err) => {
                console.log(err)
            });
    }
}
