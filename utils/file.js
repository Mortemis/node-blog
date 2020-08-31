const fs = require('fs');
const path = require('path');

exports.clearOldImg = imgPath => {
    filePath = path.join(__dirname, '..', imgPath);
    fs.unlink(filePath, err => {if (err) console.log(err)});
}