const express = require('express');
const path = require('path');
const config = require('./lib/config');
const https = require('./lib/https')();
const app = express();

let encodedCredentials = Buffer.from(config.INFOBIP_USERNAME + ':' + config.INFOBIP_PASSWORD).toString('base64');
let auth = 'Basic ' + encodedCredentials;

app.use(express.static(path.resolve(__dirname, 'public')));
app.use(express.json());

app.post('/token', (req, res) => {
    let identity = req.body.identity;
    https.post(config.INFOBIP_API_HOST, config.INFOBIP_RTC_TOKEN_PATH, JSON.stringify({ identity: identity }), auth)
        .then(tokenResponse => res.send(tokenResponse))
        .catch(err => {
            console.error(err);
            res.sendStatus(500);
        });
});

app.get('/', (req, res) => res.sendFile(path.resolve(__dirname, 'pages', 'home.html')));
app.get('/call', (req, res) => res.sendFile(path.resolve(__dirname, 'pages', 'call.html')));
app.get('/receive-call', (req, res) => res.sendFile(path.resolve(__dirname, 'pages', 'receive-call.html')));

app.listen(config.HTTP_PORT, () => console.log('App started at: http://%s:%s', 'localhost', config.HTTP_PORT));
