//.env setup
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

//imports database.js
Database = require('./database.js');
const db = new Database(process.env.DBLOCATION)

const port = process.env.PORT;

//require
const express = require('express'),
      app = express(),
      server = require('http').createServer(app),
      io = require('socket.io')(server),
      expressSession = require('express-session'),
      flash = require('express-flash');
      passport = require('passport');
      passportConfig = require('./passport-config')(passport, db);

//templating engine
app.set('view engine', 'ejs');

//express middlewares
app.use("/public", express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(expressSession({
    secret: process.env.PORT,
    resave: false,
    saveUninitialized: false
}));

//passport setup
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

//check auth yeah
const isAuth = (req, res, next) => {
    if (req.isAuthenticated())
        next();
    else {
        res.redirect("/login")
    }
};

//prepares the username
const getUsername = (req, res, next) => {
    db.getUsername(req.user)
    .then(username => {
        if (username) {
            req.username = username;
        } else req.username = null;
        next()
    });
}

// io.on("connection", socket => {
//     socket.join(sess.currRoomId)
//     io.to(sess.currRoomId).emit("update_users", usernames);
//     socket.on('disconnect', () => {
//     })
//     .then(() => {
//         socket.leave(sess.currRoomId);
//         store.set(sid, sess)
//     });
// });

app.get('/', getUsername, (req, res) => {
    if (req.isAuthenticated()) {
        res.render("index.ejs", {
            loggedIn: true,
            username: req.username
        });
    } else {
        res.render("index.ejs", {
            loggedIn: false,
            username: null
        });
    }
});

app.get('/room', isAuth, getUsername, (req, res) => {
    req.session.currRoomId = req.query.roomid;
    let roomId = req.query.roomid;
    db.getRoomName(roomId).then(name => {
        res.render("room.ejs", {
            room_name: name["room_name"],
            loggedIn: true,
            username: req.username
        });
    });
});

app.get('/signup', (req, res) => {
    res.redirect('/');
});

app.post('/signup', (req, res) => {
    if (db.databaseCredsFormatValid(req.body)) {
        db.usernameExist(req.body["username"])
        .then(uExist => {
            if (uExist)
                res.redirect('/')
            else
                return db.emailExist(req.body["email"]);
        })
        .then(() => {
            if (uExist)
                res.redirect('/')
            else
                return db.addUser(req.body)
        })
        .then(() => {
            res.redirect('/login');
        })
        .catch(err => {
            res.redirect('/')
        }).catch(err => {
            console.log(err);
        });
    } else {
        res.redirect('/');
    }
});

app.get('/login', (req, res) => {
    res.render("login.ejs", {
        loggedIn: req.session.loggedIn,
        username: req.session.user
    });
});

app.post('/login', passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));

app.get('/dashboard', isAuth, (req, res) => {
    db.getInfo("User", "username", "admin", "msgs_sent_today", "msgs_sent_total", "rooms_joined_total").then(rows => {
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

app.post('/is_email_reg', (req, res) => {
    db.emailExist(req.body.email).then(result => {
        if (result)
            res.json(true);
        else res.json(false);
    }).catch(err => {
        res.json(false);
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    req.logout()
    res.redirect("/login");
});

server.listen(port, () => {
    console.log("Visit http://127.0.0.1:" + port.toString() + " in your browser to view the app.");
});