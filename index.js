// Third party imports
const express = require('express');
const parser = require('body-parser');

const feed = require('./routes/feed');

const app = express();

// Middlewares
app.use(parser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Routing
app.use('/feed', feed);

app.listen('8080');