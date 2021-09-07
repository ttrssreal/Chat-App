//.env setup
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

//imports database.js
Database = require("./database.js");
const db = new Database(process.env.DBLOCATION)

const port = process.env.PORT;

// import
const 
    express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    // io = require('socket.io')(server),
    expressSession = require("express-session"),
    flash = require("express-flash"),
    passport = require("passport"),
    passportConfig = require("./passport-config")(passport, db),
    Utils = new (require("./utils.js"))();

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

app.use(Utils.updateUser(db));

app.get('/', (req, res) => {
    res.render("index.ejs", { user: req.isAuthenticated() ? req.user : null });
});

app.get('/room', Utils.isAuth, (req, res) => {
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
    console.log(req.body)
    if (db.databaseCredsFormatValid(req.body) == true) {
        db.usernameExist(req.body["username"])
        .then(uExist => {
            if (uExist)
                res.json({ succ: false, message: "Username already exists."  })
            else
                return db.emailExist(req.body["email"]);
        })
        .then((eExist) => {
            if (eExist)
                res.json({ succ: false, message: "Email already exists."  })
            else
                return db.addUser(req.body);
        })
        .then(() => {
            if(!res.headersSent) res.json({ succ: true, message: "Success!"});
        })
        .catch(err => {
            console.log(err);
        });
    } else {
        res.redirect('/');
    }
});

app.get('/login', (req, res) => {
    res.render("login.ejs", { user: req.isAuthenticated() ? req.user : null });
});

app.post('/login', passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));

app.get('/logout', (req, res) => {
    req.logout()
    res.redirect("/login");
});

app.get('/dashboard', Utils.isAuth, (req, res) => {
    res.render("user_dashboard.ejs", { user: req.user });
});

server.listen(port, () => {
    console.log("Visit http://127.0.0.1:" + port.toString() + " in your browser to view the app.");
});