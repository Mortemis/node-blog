const { validationResult } = require('express-validator');

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

exports.postPost = (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: 'Validation failed.', errors: errors.array() });
    }

    const title = req.body.title;
    const content = req.body.content;
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
}