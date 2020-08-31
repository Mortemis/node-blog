const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const User = require('../models/user');

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

function throwError(msg, code) {
    throw new Error(msg).statusCode = code;
}
