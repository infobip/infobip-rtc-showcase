const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.resolve(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => res.sendFile(path.resolve(__dirname, 'pages', 'home.html')));
app.get('/call', (req, res) => res.sendFile(path.resolve(__dirname, 'pages', 'call.html')));
app.get('/receive-call', (req, res) => res.sendFile(path.resolve(__dirname, 'pages', 'receive-call.html')));

const HTTP_PORT = 8010;
app.listen(HTTP_PORT, () => console.log('JQuery Showcase App started at: http://%s:%s', 'localhost', HTTP_PORT));
