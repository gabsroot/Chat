const multer = require(`multer`);

const upload = multer({ 
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, `src/public/uploads/`);
        },
        filename: (req, file, cb) => {
            const username = req.body.username;
            cb(null, username + `.png`);
        }
    })
});

module.exports = upload;
