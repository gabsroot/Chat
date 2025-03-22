const { Server } = require(`socket.io`);

const Database = require(`./models/database`);
const database = new Database(`database/database.db`);

let users = {};
let online = {};
let typing = {};

const socket = (server) => {
    const io = new Server(server, { cors: { origin: `*` } });

    io.on(`connection`, (socket) => {

        socket.on(`register`, (username) => {
            users[username] = socket.id;
            online[username] = true;
            
            // console.log(`${username} connected`);
            io.emit(`user_status`, { username, status: `online` });
        });
        
        socket.on(`send_message`, async (sender, receiver, message) => {
            if (users[receiver]) {
                io.to(users[receiver]).emit(`receive_message`, {
                    sender: sender,
                    message: message
                });
            }

            if (users[receiver]) {
                io.to(users[receiver]).emit(`user_typing`, {
                    username: sender,
                    isTyping: false
                });
            }

            sender = await database.get_user(sender);
            receiver = await database.get_user(receiver);
            
            await database.save_message(sender.id, receiver.id, message);
        });

        socket.on(`typing`, (sender, receiver, isTyping) => {
            if (!typing[receiver]) {
                typing[receiver] = {};
            }
        
            typing[receiver][sender] = isTyping;
            
            if (users[receiver]) {
                io.to(users[receiver]).emit(`user_typing`, {
                    username: sender,
                    isTyping: isTyping
                });
            }
        });

        socket.on(`disconnect`, () => {
            let disconnected = null;
            
            for (let username in users) {
                if (users[username] === socket.id) {
                    disconnected = username;
                    online[username] = false;
                    delete users[username];
                    
                    for (let receiver in typing) {
                        if (typing[receiver][disconnected]) {
                            delete typing[receiver][disconnected];
                        }
                    }
                    
                    break;
                }
            }
            
            if (disconnected) {
                // console.log(`${disconnected} disconnected`);
                io.emit(`user_status`, { username: disconnected, status: `offline` });
            }
        });
        
        socket.on(`get_online_users`, () => {
            socket.emit(`online`, online);
        });
    });
};

module.exports = socket;
