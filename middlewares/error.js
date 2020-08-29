module.exports = (error, req, res, next) => {
    console.log(`[ERROR] > ${error.statusCode}: ${error.message}`);
}