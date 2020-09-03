const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const User = require('../models/user');
const Post = require('../models/post');
const fileHelper = require('../utils/file');
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
        if (!user) throwAuthError();

        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) throwAuthError();

        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        }, cfg.JWT_SECRET, { expiresIn: '1h' });
        return { token: token, userId: user._id.toString() }
    },

    async createPost({ postInput }, req) {
        if (!req.isAuth) throwAuthError();

        const errors = [];

        if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
            errors.push({ message: 'Invalid title: too short' })
        }

        if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
            errors.push({ message: 'Invalid content' })
        }

        if (errors.length > 0) {
            const err = new Error('Invalid input');
            err.data = errors;
            err.code = 422;
            throw err;
        }
        const user = await User.findById(req.userId);

        if (!user) throwAuthError();

        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl,
            creator: user
        });
        const createdPost = await post.save();
        user.posts.push(createdPost);
        user.save();
        return {
            ...createdPost._doc,
            _id: createdPost._id.toString(),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()
        }
    },

    async posts({ page }, req) {
        if (!req.isAuth) throwAuthError();
        if (!page) page = 1;
        const perPage = 2;


        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate('creator');
        return {
            posts: posts.map(p => {
                return {
                    ...p._doc,
                    _id: p._id.toString(),
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString()
                };
            }), totalPosts: totalPosts
        }
    },

    async post({ id }, req) {
        if (!req.isAuth) throwAuthError();
        const post = await Post.findById(id).populate('creator');
        if (!post) throwNoPostError();
        return {
            ...post._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt.toString(),
            updatedAt: post.updatedAt.toString()
        }
    },

    async updatePost({ id, postInput }, req) {
        if (!req.isAuth) throwAuthError();

        const post = await Post.findById(id).populate('creator');
        if (!post) throwNoPostError();

        if (post.creator._id.toString() !== req.userId.toString()) throwAuthError();

        const errors = [];

        if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
            errors.push({ message: 'Invalid title: too short' })
        }

        if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
            errors.push({ message: 'Invalid content' })
        }

        if (errors.length > 0) {
            const err = new Error('Invalid input');
            err.data = errors;
            err.code = 422;
            throw err;
        }
        post.title = postInput.title;
        post.content = postInput.content;
        if (postInput.imageUrl !== 'undefined') post.imageUrl = postInput.imageUrl;

        const createdPost = await post.save();
        return {
            ...createdPost._doc,
            _id: createdPost._id.toString(),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()
        }
    },

    async deletePost({ id }, req) {
        if (!req.isAuth) throwAuthError();

        const post = await Post.findById(id);

        if (!post) throwNoPostError();

        if (post.creator._id.toString() !== req.userId.toString()) throwAuthError();

        fileHelper.clearOldImg(post.imageUrl);

        await Post.findByIdAndRemove(id);

        const user = await User.findById(req.userUd);

        user.posts.pull(id);

        await user.save();

        return true;
    },

    async user(args, req) {
        if (!req.isAuth) throwAuthError();

        const user = await User.findById(req.userId);
        if (!user) throwAuthError();

        return { ...user._doc, _id: user._id.toString() };
    },

    async updateStatus({ status }, req) {
        if (!req.isAuth) throwAuthError();

        const user = await User.findById(req.userId);
        if (!user) throwAuthError();

        user.status = status;
        await user.save();
        return {
            ...user._doc,
            _id: user._id.toString()
        }
    }

}

function throwAuthError() {
    const err = new Error('Not authenticated');
    err.code = 401;
    throw err;
}

function throwNoPostError() {
    const err = new Error('No post found.');
    err.code = 404;
    throw err;
}

