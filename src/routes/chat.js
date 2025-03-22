const express = require(`express`);
const Database = require(`../models/database`);
const fs = require(`fs`);
const path = require(`path`);

const router = express.Router();
const database = new Database(`database/database.db`);

router.get(`/chat`, async (req, res) => {
    if (!req.session.user) {
        return res.redirect(`/login`);
    }
 
    let [users, me] = await Promise.all([
        database.get_users(),
        database.get_user(req.session.user)
    ]);
    
    users = users.filter(user => user.username !== req.session.user);
 
    await Promise.all(users.map(async user => {
        user.recent = await database.get_last_message(me.id, user.id);
        return user;
    }));
 
    // sort
    if (users.some(user => user.recent)) {
        users.sort((a, b) => {
            if (!a.recent) {
                return 1;
            }

            if (!b.recent) {
                return -1;
            }

            return new Date(b.recent.timestamp) - new Date(a.recent.timestamp);
        });
    }
    
    users = users.map(user => ({
        ...user,
        name: user.name.length > 15 ? user.name.slice(0, 15) : user.name,
        img: fs.existsSync(path.join(__dirname, `../public/uploads/${user.username}.png`)) ? `/uploads/${user.username}.png` : `/images/user-default.png`
    }));
    
    res.render(`chat`, { users: users });
 });

// get messages
router.get(`/messages/:username`, async (req, res) => {
    let sender = await database.get_user(req.session.user);
    let receiver = await database.get_user(req.params.username);

    if (!sender) {
        return res.status(401).json({ error: `unauthorized` });
    }

    let messages = await database.get_messages(sender.id, receiver.id);

    messages = messages.map(message => ({
        message: message.message,
        self: message.sender === sender.id
    }));

    res.send(messages);
});

// get last message
router.get(`/last-message/:username`, async (req, res) => {
    let sender = await database.get_user(req.session.user);
    let receiver = await database.get_user(req.params.username);
    
    if (!sender || !receiver) {
        return res.status(404).json({ error: `User not found` });
    }
    
    let last = await database.get_last_message(sender.id, receiver.id);

    res.json({ 
        message: last ? last.message : null,
        self: last ? last.sender == sender.id : null
    });
});

module.exports = router;
