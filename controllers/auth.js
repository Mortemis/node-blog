const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const User = require('../models/user');

const cfg = require('../config.json');

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throwError(errors.array().toString(), 422);

    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

    try {
        const hashedPwd = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            name: name,
            password: hashedPwd
        });

        const result = await user.save();

        res.status(201).json({ message: 'User created', userId: result._id });

    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
}

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    try {
        const user = await User.findOne({ email: email }).exec();

        if (!user) throwError('User not found', 401);

        const isRightPwd = await bcrypt.compare(password, user.password);

        if (!isRightPwd) throwError('Password mismatch', 401);

        const token = jwt.sign({
            email: user.email,
            userId: user._id.toString()
        }, cfg.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token: token, userId: user._id.toString() });
        return;
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    }
}

function throwError(msg, code) {
    const err = new Error(msg);
    err.statusCode = code;
    throw err;
}
