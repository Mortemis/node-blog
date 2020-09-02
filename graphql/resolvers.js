const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const User = require('../models/user');
const Post = require('../models/post');
const cfg = require('../config.json');
const { postStatus } = require('../controllers/feed');

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
    },

    async createPost({ postInput }, req) {
        if (!req.isAuth) {
            const err = new Error('Not authenticated');
            err.code = 401;
            throw err;
        }

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

        if (!user) {
            const err = new Error('User not found');
            err.code = 401;
            throw err;
        }

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
        if (!req.isAuth) {
            const err = new Error('Not authenticated');
            err.code = 401;
            throw err;
        }
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
    }

}