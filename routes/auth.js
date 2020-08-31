const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const auth = require('../controllers/auth');

const router = express.Router();

router.put('/signup',
    body('email')
        .isEmail()
        .withMessage('Invalid email.')
        .custom((value, { req }) => {
            return User.findOne({ email: value }).then(doc => {
                if (doc) return Promise.reject('Email exists')
            })
        })
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({ min: 5 }),
    body('name')
        .trim()
        .notEmpty(),
    auth.signup
);

router.post('/login', auth.login);

module.exports = router;