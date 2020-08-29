const express = require('express');
const { body } = require('express-validator');

const feedCtr = require('../controllers/feed');

const router = express.Router();

router.get('/posts', feedCtr.getPosts);

router.post('/post',
    [
        body('title').trim().isLength({ min: 5 }),
        body('content').trim().isLength({ min: 5 })
    ],
    feedCtr.postPost);

module.exports = router;