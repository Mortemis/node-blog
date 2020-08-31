const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');
const fileUtil = require('../utils/file');

exports.getPosts = async (req, res) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;

    try {
        const totalItems = await Post.find().countDocuments().exec();

        const posts = await Post.find()
            .skip((currentPage - 1) * perPage)
            .limit(perPage)
            .exec();

        res.status(200).json({ message: 'Fetched posts', posts: posts, totalItems: totalItems });
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
}

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;

    try {
        const post = await Post.findById(postId).exec();

        if (!post) throwError('No post found', 404);

        res.status(200).json({ message: 'Post fetched', post: post });

    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
}

exports.postPost = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) throwError('Invalid data.', 422);
    if (!req.file) throwError('No image provided.', 422)

    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path.replace('\\', '/');

    console.log(req.userId);

    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    });

    try {
        await post.save();

        const user = await User.findById(req.userId).exec();
        user.posts.push(post);
        await user.save();

        // Create post in a db
        res.status(201).json({
            msg: 'Post created successfully',
            post: post,
            creator: { _id: user._id, name: user.name }
        });
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
}

exports.updatePost = async (req, res, next) => {
    const postId = req.params.postId;

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) throwError('Invalid data.', 422);

    // Get new post data from req body
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;

    // If new image uploaded
    if (req.file) imageUrl = req.file.path;

    if (!imageUrl) throwError('No file uploaded!', 422);

    try {
        // Get single post from db
        const post = await Post.findById(postId).exec();
        if (!post) throwError('No post found!', 404);
        if (post.creator.toString() !== req.userId) throwError('Unauthorized edit.', 403);

        // Delete old image
        if (imageUrl !== post.imageUrl) fileUtil.clearOldImg(post.imageUrl);

        // Set new data to post
        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl.replace('\\', '/');

        await post.save();

        res.status(200).json({ message: 'Post updated', post: post })
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }

}

exports.deletePost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId).exec();
        if (post.creator.toString() !== req.userId) throwError('Unauthorized edit.', 403);
        
        fileUtil.clearOldImg(post.imageUrl);

        await Post.findByIdAndRemove(postId).exec();
        console.log('[INFO] Post deleted: ' + postId);
        
        const user = await User.findById(req.userId).exec();
        user.posts.pull(postId);
        await user.save();

        res.status(200).json({ message: 'Post deleted' })
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
}

function throwError(msg, code) {
    const err = new Error(msg);
    err.statusCode = code;
    throw err;
}
