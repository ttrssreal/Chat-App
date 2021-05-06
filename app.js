const express = require('express'),
      app = express(),
      server = require('http').createServer(app),
      socketio = require('socket.io')(server),
      bodyParser = require('body-parser'),
      expressSession = require('express-session'),
      db = require('./database.js'),
      cookieParser = require('cookie-parser');

const port = 9999;

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
    if (req.session.loggedIn)
        next();
    else {
        req.session.loginMessage = "You need to log in to use this!"
        res.redirect("/login")
    }
};

app.set('view engine', 'ejs');

socketio.on("connection", socket => {
    socketio.emit("new_user", "Johnny");
    socket.on("message", data => {
        socketio.emit("message", data)
    });
});

app.get('/', (req, res) => {
    res.render("index.ejs", { loggedIn: req.session.loggedIn, username: req.session.user });
});

app.get('/room', validateSession, (req, res) => {
    req.session.currRoomId = req.query.roomid;
    res.render("room.ejs", {
        room_name: req.query.num,
        loggedIn: req.session.loggedIn, 
        username: req.session.user
    });
});

app.get('/signup', (req, res) => {
    res.redirect('/');
});

app.post('/signup', (req, res) => {
    if (db.databaseCredsFormatValid(req.body)) {
        db.usernameExist(req.body["username"]).then(() => {
            res.redirect('/')
        }).catch(err => {
            db.emailExist(req.body["email"]).then(() => {
                res.redirect('/')
            }).catch(err => {
                db.addUser(req.body).then(() => {
                    res.redirect('/login');
                }).catch(err => {
                    res.redirect('/')
                });
            });
        });
    } else {
        res.redirect('/');
    }
});

app.get('/login', (req, res) => {
    res.render("login.ejs", { loggedIn: req.session.loggedIn, username: req.session.user });
});

app.post('/login', (req, res) => {
    if (!req.session.loggedIn) {
        req.session.loggedIn = false;
    }
    db.databaseCredsValid({
        username: req.body["username"],
        password: req.body["password"]
    }).then(() => {
        req.session.user = req.body["username"];
        req.session.loggedIn = true;
        res.redirect('/');
    }).catch(err => {
        req.session.loginMessage = "Username or Password is incorrect";
        res.redirect('/login');
    });
});

app.get('/dashboard', validateSession, (req, res) => {
    db.getUserInfo("admin", "msgs_sent_today", "msgs_sent_total", "rooms_joined_total").then(rows => {
        rows = rows.map(row => { return row[0]; });
        res.render("user_dashboard.ejs", {
            username: req.session.user,
            msgs_sent_today: rows[0]["msgs_sent_today"],
            msgs_sent_total: rows[1]["msgs_sent_total"],
            rooms_joined_total: rows[2]["rooms_joined_total"],
            loggedIn: req.session.loggedIn,
            username: req.session.user
        });
    });
});

app.get('/ad', (req, res) => {
    req.session.user = "admin";
    res.redirect('/dashboard');
});

app.post('/is_username_reg', (req, res) => {
    db.usernameExist(req.body.username).then(() => {
        res.json({registered: true});
    }).catch(err => {
        res.json({registered: false});
    });
});

app.post('/is_email_reg', (req, res) => {
    db.emailExist(req.body.email).then(() => {
        res.json({registered: true});
    }).catch(err => {
        res.json({registered: false});
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

server.listen(port, () => {
    console.log("Visit http://localhost:" + port.toString() + " in your browser to view the app.");
});
