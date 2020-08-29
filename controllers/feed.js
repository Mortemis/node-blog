exports.getPosts = (req, res) => {
    res.status(200).json(
        {
            posts: [
                {
                    title: 'First Post',
                    content: '123123'
                }
            ]
        }
    );
}

exports.postPost = (req, res) => {
    const title = req.body.title;
    const content = req.body.content;
    // Create post in a db
    res.status(201).json({
        msg: 'Post created successfully',
        post: { id: Date.now(), title: title, content: content }
    });
}