const { validationResult } = require('express-validator');

const Post = require('../models/post');

exports.getPosts = async (req, res) => {

    try {
        const posts = await Post.find().exec();

        res.status(200).json({ message: 'Fetched posts', posts: posts });
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
}

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;

    try {
        const post = await Post.findById(postId).exec();

        if (!post) throw new Error('No post found').statusCode = 404;

        res.status(200).json({ message: 'Post fetched', post: post });

    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
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