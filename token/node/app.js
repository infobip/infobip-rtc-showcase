const express = require('express');
var config = require('./config.json');
const https = require('./lib/https')();
const app = express();
app.use(express.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
const AUTH = 'Basic ' + Buffer.from(config.INFOBIP_USERNAME + ':' + config.INFOBIP_PASSWORD).toString('base64');
const IDENTITY_PREFIX = 'user';
let counter = 1;

app.post('/token', (req, res) => {
    let identity = IDENTITY_PREFIX + counter;
    https.post(config.INFOBIP_API_HOST, config.INFOBIP_RTC_TOKEN_PATH, JSON.stringify({ identity: identity }), AUTH)
        .then(function(tokenResponse) {
            counter++;
            let response = JSON.parse(tokenResponse);
            response.identity = identity;
            res.json(response);
        })
        .catch(err => {
            console.error(err);
            res.sendStatus(500);
        });
});

app.listen(config.HTTP_PORT, () => console.log('Token Application started at: http://%s:%s', 'localhost', config.HTTP_PORT));
