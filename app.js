const express = require('express');
const app = express();
const server = require('http').createServer(app);
const socketio = require('socket.io')(server);
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const db = require('./database.js');

const port = 5000;

const store = new expressSession.MemoryStore();

app.use("/public", express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressSession({
    secret: "secret",
    store: store,
    resave: true,
    saveUninitialized: false
}));
const validateSession = (req, res, next) => {
    if (req.session.user)
        next();
    else res.redirect("/login");
        
};

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

app.get('/signup', (req, res) => {
    res.redirect('/');
});

app.post('/signup', (req, res) => {
    if (db.databaseCredsFormatValid(req.body)) {
        db.userExist(req.body["username"], (exists) => {
            if (!exists)
                db.addUser(req.body, result => {
                    console.log(result);
                });
        });
    }
    res.redirect('/');
});

app.get('/login', (req, res) => {
    res.render("login.ejs");
});

app.post('/login', (req, res) => {
    db.databaseCredsValid({
        username: req.body["username"],
        password: req.body["password"]
    }, isValid => {
        if (isValid) {
            console.log("GUUD");
            req.session.user = req.body["username"];
            res.redirect('/dashboard');
        }
        else res.redirect('/login');
    });
});

app.get('/dashboard', validateSession, (req, res) => {
    console.log(req.session.user);
    res.render("user_dashboard.ejs", {
        username: req.session.user,
        msgs_sent_total: 100000
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
});

server.listen(port, () => {
    console.log("Visit http://localhost:" + port.toString() + " in your browser to view the app.");
});