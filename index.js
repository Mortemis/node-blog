const path = require('path');
// Third party imports
const express = require('express');
const parser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const gql = require('express-graphql');

const feed = require('./routes/feed');
const auth = require('./routes/auth');
const errorHandler = require('./middlewares/error');
const ws = require('./utils/ws');
const gqlSchema = require('./graphql/schema');
const gqlResolver = require('./graphql/resolvers');
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
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Routing
app.use('/feed', feed);

app.use('/auth', auth);

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/graphql', gql.graphqlHTTP({
    schema: gqlSchema,
    rootValue: gqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
        if (!err.originalError) {
            return err;
        }
        const data = err.originalError.data;
        const msg = err.originalError.message;
        const code = err.originalError.code || 500;
        return { data: data, msg: msg, code: code };
    }
}));

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