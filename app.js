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
    else {
        req.session.loginMessage = "You need to log in to use this!"
        res.redirect("/login")
    }
        
};

app.set('view engine', 'ejs');

socketio.on("connection", socket => {
    socketio.emit("new_user", "Johnny");
    socket.on("message", (data) => {
        socketio.emit("message", data)
    });
});

app.get('/', (req, res) => {
    res.render("index.ejs", { message: req.session.createAccMessage });
});

app.get('/room', validateSession, (req, res) => {
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
            if (!exists) {
                db.addUser(req.body, result => {
                    console.log(result);
                });
                req.session.createAccMessage = "Succsess";
                res.redirect('/')
            }
            else {
                req.session.createAccMessage = "user exists";
                res.redirect('/')
            }
        });
    } else {
        req.session.createAccMessage = "invalid cred";
        res.redirect('/');
    }
});

app.get('/login', (req, res) => {
    res.render("login.ejs", { message: req.session.loginMessage });
});

app.post('/login', (req, res) => {
    db.databaseCredsValid({
        username: req.body["username"],
        password: req.body["password"]
    }, isValid => {
        if (isValid) {
            console.log("GUUD");
            req.session.user = req.body["username"];
            req.session.loginMessage = "";
            res.redirect('/dashboard');
        }
        else {
            req.session.loginMessage = "Username or Password is incorrect";
            res.redirect('/login');
        } 
    });
});

app.get('/dashboard', validateSession, (req, res) => {
    db.exec_query("SELECT msgs_sent_today FROM User WHERE username='"+req.session.user+"'", rows => {
        let msgs_sent_today = rows[0]["msgs_sent_today"];
        console.log(rows[0]);
        db.exec_query("SELECT msgs_sent_total FROM User WHERE username='"+req.session.user+"'", rows => {
            let msgs_sent_total = rows[0]["msgs_sent_total"];
            db.exec_query("SELECT rooms_joined_total FROM User WHERE username='"+req.session.user+"'", rows => {
                let rooms_joined_total = rows[0]["rooms_joined_total"];
                res.render("user_dashboard.ejs", {
                    username: req.session.user,
                    msgs_sent_today: msgs_sent_today,
                    msgs_sent_total: msgs_sent_total,
                    rooms_joined_total: rooms_joined_total
                });
            });
        });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
});

server.listen(port, () => {
    console.log("Visit http://localhost:" + port.toString() + " in your browser to view the app.");
});