const express = require(`express`);
const Database = require(`../models/database`);
const upload = require(`../utils/upload`);

const router = express.Router();
const database = new Database(`database/database.db`);

router.get([`/`, `/login`], (req, res) => {
    res.render(`login`);
});

router.post(`/login`, (req, res) => {
    let { username, password } = req.body;

    database.login(username, password).then((allowed) => {
        if (!allowed) {
            res.send({code: 404});
            return
        }

        req.session.user = username;

        res.send({code: 200})
    });
});

router.get(`/register`, (req, res) => {
    res.render(`register`);
});

router.post(`/register`, upload.single(`image`), (req, res) => {
    let { username, password, name, bio } = req.body;

    database.register_user(username, password, name, bio)
        .then(() => {
            req.session.user = username;
            res.sendStatus(200);
        })
        .catch(() => {
            res.sendStatus(404);
        })
});

module.exports = router;
