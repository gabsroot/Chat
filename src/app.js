const express = require(`express`);
const session = require(`express-session`);
const http = require(`http`);
const path = require(`path`);
const user = require(`./routes/user`);
const auth = require(`./routes/auth`);
const chat = require(`./routes/chat`);
const { PORT, SESSION } = require(`./config`);
const socket = require(`./socket`);

const app = express();
const server = http.createServer(app);

// skt
socket(server);

app.use(express.json());
app.use(session(SESSION));
app.use(express.static(path.join(__dirname, `public`)));

// ejs
app.set(`view engine`, `ejs`);
app.set(`views`, path.join(__dirname, `views`)); 

app.use(user);
app.use(auth);
app.use(chat);

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
