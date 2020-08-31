const path = require('path');
// Third party imports
const express = require('express');
const parser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');

const feed = require('./routes/feed');
const auth = require('./routes/auth');
const errorHandler = require('./middlewares/error');
const ws = require('./utils/ws');
/**
 * config.json example:
 * { "MONGO_URI": "<mongo uri string>" } 
 */
const config = require('./config.json');

const app = express();

const imgStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, `/${Date.now()}-${file.originalname}`);
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/bmp') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}
// Middlewares
app.use(parser.json());

app.use(multer({ storage: imgStorage, fileFilter: fileFilter })
    .single('image'));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Routing
app.use('/feed', feed);

app.use('/auth', auth);

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(errorHandler);

mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
mongoose.set("useFindAndModify", false);
mongoose.connect(config.MONGO_URI)
    .then(res => {
        const server = app.listen('8080', () => console.log('[INFO] DB connected & app started'));
        
        
        const io = ws.init(server);
        io.on('connection', socket => {
            console.log('Client connected');
        });
    })
    .catch(err => console.log(err));