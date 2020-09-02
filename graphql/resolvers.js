const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const User = require('../models/user');
const cfg = require('../config.json');

module.exports = {
    async createUser({ userInput }) {
        const errors = [];
        if (!validator.isEmail(userInput.email)) {
            errors.push({ message: 'Invalid email' });
        }

        if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5 })) {
            errors.push({ message: 'Password too short.' })
        }

        if (errors.length > 0) {
            const err = new Error('Invalid input');
            err.data = errors;
            err.code = 422;
            throw err;
        }


        // Check if user exists in database
        const existingUser = await User.findOne({ email: userInput.email });
        if (existingUser) throw new Error('User exists!');

        const hashedPwd = await bcrypt.hash(userInput.password, 12);

        const user = new User({
            email: userInput.email,
            name: userInput.name,
            password: hashedPwd
        });

        const createdUser = await user.save();
        return { ...createdUser._doc, _id: createdUser._id.toString() };
        //const email = args.userInput.email;
    },

    async login({ email, password }) {
        const user = await User.findOne({ email: email });
        if (!user) {
            const err = new Error('User not found');
            err.code = 401;
            throw err;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const err = new Error('Incorrect pwd');
            err.code = 401;
            throw err;
        }
        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        }, cfg.JWT_SECRET, { expiresIn: '1h' });
        return { token: token, userId: user._id.toString() }
    }
}