const express = require(`express`);
const Database = require(`../models/database`);

const router = express.Router();
const database = new Database(`database/database.db`);

router.get(`/user/:username`, (req, res) => {
    database.get_user(req.params.username).then((data) => {
        res.status(200).json({ available: !data });
    });
});

module.exports = router;
