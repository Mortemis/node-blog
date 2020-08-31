const express = require('express');
const { body } = require('express-validator');

const feedCtr = require('../controllers/feed');
const isAuth = require('../middlewares/is-auth');

const router = express.Router();

router.get('/posts', isAuth, feedCtr.getPosts);

router.post('/post', isAuth, [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 5 })
], feedCtr.postPost);

router.route('/post/:postId')
    .get(feedCtr.getPost)
    .put(isAuth,
        body('title').trim().isLength({ min: 5 }),
        body('content').trim().isLength({ min: 5 }),
        feedCtr.updatePost)
    .delete(isAuth, feedCtr.deletePost);

router.route('/status')
    .get(isAuth, feedCtr.getStatus)
    .post(isAuth,
        feedCtr.postStatus);

module.exports = router;