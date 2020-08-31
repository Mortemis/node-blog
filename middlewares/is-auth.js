const jwt = require('jsonwebtoken');

const cfg = require('../config.json');

module.exports = (req, res, next) => {

    const authHeader = req.get('Authorization');

    if (!authHeader) {
        const err = new Error('Not authenticated.');
        err.statusCode = 401;
        throw err;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = jwt.verify(token, cfg.JWT_SECRET);
        
        if (!decodedToken) {
            const err = new Error('Not authenticated.');
            err.statusCode = 401;
            throw err;
        }

        req.userId = decodedToken.userId;
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        throw err;
    }
    next();
}