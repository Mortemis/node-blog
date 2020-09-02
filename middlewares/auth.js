const jwt = require('jsonwebtoken');

const cfg = require('../config.json');

module.exports = (req, res, next) => {

    const authHeader = req.get('Authorization');

    if (!authHeader) {
        req.isAuth = false;
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = jwt.verify(token, cfg.JWT_SECRET);

        if (!decodedToken) {
            req.isAuth = false;
            return next();
        }

        req.userId = decodedToken.userId;
        req.isAuth = true;
    } catch (err) {
        req.isAuth = false;
        return next();
    }
    next();
}