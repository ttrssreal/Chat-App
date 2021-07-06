const express = require('express'),
      app = express(),
      server = require('http').createServer(app),
      io = require('socket.io')(server),
      expressSession = require('express-session'),
      db = require('./database.js'),
      cookie = require('cookie');
      cookieParser = require('cookie-parser');
      flash = require('express-flash');
      passport = require('passport');
      passportConfig = require('./passport-config')(passport);

const port = 9999;

const store = new expressSession.MemoryStore();

app.set('view engine', 'ejs');
app.use("/public", express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(expressSession({
    secret: "secret",
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// db.getRoomCurrUsers(3).then(users => console.log(users.map(user => {return user["uid"]})));
// db.getRoomName(3).then(console.log);
// db.getUsername(9).then(console.log);

const validateSession = (req, res, next) => {
    if (req.session.loggedIn)
        next();
    else {
        res.redirect("/login")
    }
};

io.use((socket, next) => {
    // console.log(socket.request.headers.cookie);
    // console.log(cookie.parse(socket.request.headers.cookie));
    let sid = cookieParser.signedCookie(cookie.parse(socket.request.headers.cookie)["connect.sid"], "secret");
    store.get(sid, (err, session) => {
        socket.session = session;
        next();
    });
});

io.on("connection", socket => {
    sess = socket.session;
    console.log(sess);
    if (!sess)
        return
    socket.join(sess.currRoomId)
    db.getRoomCurrUsers(sess.currRoomId)
    .then(uids => {
        uids = uids.map(row => { return row["uid"]; });
        Promise.all(uids.map(uid => {
            return new Promise((res, rej) => {
                db.getUsername(uid).then(username => {
                    res(username);
                }).catch(err => rej(err))
            });
        }))
        .then(usernames => {
            console.log(usernames);
            io.to(sess.currRoomId).emit("update_users", usernames);
        })
    });
    socket.on('disconnect', () => {
        db.removeUserFromRoom(sess.currRoomId, sess.user).then(() => {
            db.getRoomCurrUsers(sess.currRoomId)
            .then(uids => {
                uids = uids.map(row => { return row["uid"]; });
                Promise.all(uids.map(uid => {
                    return new Promise((res, rej) => {
                        db.getUsername(uid).then(username => {
                            res(username);
                        }).catch(err => rej(err))
                    });
                }))
                .then(usernames => {
                    console.log(usernames);
                    io.to(sess.currRoomId).emit("update_users", usernames);
                });
            });
        }).then(() => {
            socket.leave(sess.currRoomId);
            let sid = cookieParser.signedCookie(cookie.parse(socket.request.headers.cookie)["connect.sid"], "secret");
            sess.currRoomId = null;
            store.set(sid, sess)
        });
    });
});

app.get('/', (req, res) => {
    res.render("index.ejs", {
        loggedIn: req.session.loggedIn,
        username: req.session.user
    });
});

app.get('/room', validateSession, (req, res) => {
    req.session.currRoomId = req.query.roomid;
    let roomId = req.query.roomid;
    let user = req.session.user;
    db.addUserTooRoom(roomId, user)
    db.getRoomName(roomId).then(name => {
        res.render("room.ejs", {
            room_name: name[0]["room_name"],
            loggedIn: true,
            username: user
        });
    });
});

app.get('/signup', (req, res) => {
    res.redirect('/');
});

app.post('/signup', (req, res) => {
    if (db.databaseCredsFormatValid(req.body)) {
        db.usernameExist(req.body["username"]).then(uExist => {
            if (uExist)
                res.redirect('/')
            else {
                db.emailExist(req.body["email"]).then(() => {
                    if (uExist)
                        res.redirect('/')
                    else {
                        db.addUser(req.body).then(() => {
                            res.redirect('/login');
                        }).catch(err => {
                            res.redirect('/')
                        });
                    }
                }).catch(err => {
                    console.error(err);
                });
            }
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

app.get('/dashboard', validateSession, (req, res) => {
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

app.post('/is_username_reg', (req, res) => {
    db.usernameExist(req.body.username).then(result => {
        if (result)
            res.json(true);
        else res.json(false);
    }).catch(err => {
        res.json(false);
    });
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
    res.redirect("/login");
});

server.listen(port, () => {
    console.log("Visit http://localhost:" + port.toString() + " in your browser to view the app.");
});
