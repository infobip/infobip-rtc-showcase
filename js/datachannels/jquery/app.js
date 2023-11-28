const express = require('express');
const path = require('path');

const app = express();

app.use(express.static(path.resolve(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => res.sendFile(path.resolve(__dirname, 'pages', 'app.html')));

const HTTP_PORT = 9000;
app.listen(HTTP_PORT, () => console.log('jQuery Showcase App started at: http://%s:%s', 'localhost', HTTP_PORT));
