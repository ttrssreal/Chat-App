/* 
Main file. Registers route handlers and sets up other functionalities such as 
an sqlite3 database, socketio, a session store, passportjs and some custom middleware.
*/

//.env setup
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const port = process.env.PORT;

//import database utils
Database = require("./database.js");
const db = new Database(process.env.DBLOCATION)

// import
const 
    express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    expressSession = require("express-session"),
    flash = require("express-flash"),
    passport = require("passport"),
    passportConfig = require("./passport-config.js")(passport, db),
    Utils = new (require("./utils.js"))();
    

//templating engine
app.set('view engine', 'ejs');

// session storage
const store = new expressSession.MemoryStore();

// setup socketio
socketio = new (require("./socketio.js"))(server, db, process.env.SECRET, store);

//express middlewares
app.use("/public", express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(expressSession({
    store: store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

//passport setup
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// custom middleware
app.use(Utils.updateUser(db));

// regester "root" route handler
app.get('/', (req, res) => {
    res.render("index.ejs", { user: req.isAuthenticated() ? req.user : null });
});

// Register room route handler
app.get('/room', Utils.isAuth, (req, res) => {
    db.addUserTooRoom(req.query.roomid, req.user.uid)
    .then(rid => {
        // getRoomName
        return db.getRoomName(rid);
    }).then(rName => {
        res.render("room.ejs", {
            // req.user exists because route uses Utils.isAuth
            user: req.user,
            room_name: rName.room_name,
        });
    }).catch(err => { console.log(err) })
});

// Register signup route handler
app.get('/signup', (req, res) => {
    res.redirect('/');
});

app.post('/signup', (req, res) => {
    // databaseCredsFormatValid
    if (db.databaseCredsFormatValid(req.body) != true) {
        res.redirect('/');
        return;
    }
    // usernameExist
    db.usernameExist(req.body["username"])
    .then(uExist => {
        if (uExist)
            res.json({ succ: false, message: "Username already exists."  })
        else
            // emailExist
            return db.emailExist(req.body["email"]);
    })
    .then((eExist) => {
        if (eExist)
            res.json({ succ: false, message: "Email already exists."  })
        else
            // addUser
            return db.addUser(req.body);
    })
    .then(() => {
        if(!res.headersSent) res.json({ succ: true, message: "Success!"});
    })
    .catch(err => {
        console.log(err);
    });
});

// Register login route handler
app.get('/login', (req, res) => {
    res.render("login.ejs", { user: req.isAuthenticated() ? req.user : null });
});

// Handled in passport-config.js
app.post('/login', passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));

// Register logout route handler
app.get('/logout', (req, res) => {
    req.logout()
    res.redirect("/login");
});

// Register dashboard route handler
app.get('/dashboard', Utils.isAuth, (req, res) => {
    res.render("user_dashboard.ejs", { user: req.user });
});

// accept connections on loopback port "port"
server.listen(port, () => {
    console.log("Visit http://127.0.0.1:" + port.toString() + " in your browser to view the app.");
});