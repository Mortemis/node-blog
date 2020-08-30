module.exports = (error, req, res, next) => {
    console.log(`[ERROR] > ${error.statusCode}: ${error.message}`);
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({message: message});
}