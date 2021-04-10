const express = require('express');
const app = express();
const server = require('http').createServer(app);
const socketio = require('socket.io')(server);
const bodyParser = require('body-parser');

const port = 5000;

app.use("/public", express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));;
app.set('view engine', 'ejs');

socketio.on("connection", socket => {
    socketio.emit("new_user", "Johnny");
    socket.on("message", (data) => {
        socketio.emit("message", data)
    });
});

app.get('/', (req, res) => {
    res.render("index.ejs");
});

app.get('/room', (req, res) => {
    res.render("room.ejs", {
        room_number: req.query.num
    });
});

server.listen(port, () => {
    console.log("Visit http://localhost:" + port.toString() + " in your browser to view the app.");
});