//.env setup
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

//imports database.js
Database = require('./database.js');
const db = new Database(process.env.DBLOCATION)

const port = process.env.PORT;

// import
const 
    express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    // io = require('socket.io')(server),
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
    req.isAuthenticated() ? next() : res.redirect("/login")
};

app.get('/', (req, res) => {
    res.render("index.ejs", { user: req.isAuthenticated() ? req.user : null });
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

app.get('/ad', (req, res) => {
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

app.get('/signup', (req, res) => {
    res.redirect('/');
});

app.post('/signup', (req, res) => {
    if (db.databaseCredsFormatValid(req.body)) {
        db.usernameExist(req.body["username"])
        .then(uExist => {
            if (uExist)
                res.redirect("/")
            else
                return db.emailExist(req.body["email"]);
        })
        .then((eExist) => {
            if (eExist) {
                res.redirect('/');
            }
            else
                return db.addUser(req.body);
        })
        .then(info => {
            res.redirect('/login');
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

app.get('/dashboard', isAuth, (req, res) => {
    res.render("user_dashboard.ejs", { user: req.user });
});

server.listen(port, () => {
    console.log("Visit http://127.0.0.1:" + port.toString() + " in your browser to view the app.");
});