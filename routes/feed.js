const express = require('express');

const feedCtr = require('../controllers/feed');

const router = express.Router();

router.get('/posts', feedCtr.getPosts);

router.post('/post', feedCtr.postPost);

module.exports = router;