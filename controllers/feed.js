const { validationResult } = require('express-validator');

const Post = require('../models/post');

exports.getPosts = (req, res) => {
    res.status(200).json(
        {
            posts: [
                {
                    _id: '123',
                    title: 'First Post',
                    content: '123123',
                    imageUrl: 'images/book.png',
                    creator: {
                        name: 'Admin'
                    },
                    createdAt: new Date()
                }
            ]
        }
    );
}

exports.postPost = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new Error('Invalid data.').statusCode = 422;

    const title = req.body.title;
    const content = req.body.content;

    const post = new Post({
        title: title,
        content: content,
        imageUrl: 'images/book.png',
        creator: { name: 'Admin' },
    });
    try {
        await post.save();

        // Create post in a db
        res.status(201).json({
            msg: 'Post created successfully',
            post: {
                _id: Date.now(),
                title: title,
                content: content,
                creator: { name: 'Admin' },
                createdAt: new Date()
            }
        });
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
}