const path = require('path');
// Third party imports
const express = require('express');
const parser = require('body-parser');
const mongoose = require('mongoose');

const feed = require('./routes/feed');
const errorHandler = require('./middlewares/error');
/**
 * config.json example:
 * { "MONGO_URI": "<mongo uri string>" } 
 */
const config = require('./config.json');

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

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(errorHandler);

mongoose.set("useNewUrlParser", "true");
mongoose.set("useUnifiedTopology", "true");
mongoose.connect(config.MONGO_URI)
    .then(res =>
        app.listen('8080', () => console.log('[INFO] DB connected & app started'))
    )
    .catch(err => console.log(err));