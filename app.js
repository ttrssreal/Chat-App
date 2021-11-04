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
const db = require("./database.js");

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
socketio = new (require("./socketio.js"))(server, store);

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

app.use("/user", require("./routes/user.js"));
app.use("/room", require("./routes/rooms.js"));

// regester "root" route handler
app.get('/', (req, res) => {
    res.render("index.ejs", { user: req.isAuthenticated() ? req.user : null });
});

// Register signup route handler
app.get('/signup', (req, res) => {
    res.redirect('/');
});

app.post('/signup', (req, res) => {
    // databaseCredsFormatValid
    if (db.databaseCredsFormatValid(req.body) != true) {
        res.json({ success: false, message: "Credentials format is incorrect"  })
        return;
    }
    // usernameExist
    db.usernameExist(req.body["username"])
    .then(uExist => {
        if (uExist)
            res.json({ success: false, message: "Username already exists."  })
        else
            // emailExist
            return db.emailExist(req.body["email"]);
    })
    .then((eExist) => {
        if (eExist)
            res.json({ success: false, message: "Email already exists."  })
        else
            // addUser
            return db.addUser(req.body);
    })
    .then(() => {
        if(!res.headersSent) res.json({ success: true, message: "Success!"});
    })
    .catch(err => {
        console.log(err);
    });
});

// endpoint to set a favourite room
app.post('/favourite', Utils.isAuth, (req, res) => {
    db.dbLnk.all("SELECT room_name, rid FROM Room", async (err, rooms) => {
        for (let i = 0; i < rooms.length; i++) {
            let room = rooms[i];
            if (room.room_name == req.body.rName) {
                let rid = room.rid;
                await db.setFavRoomId(req.user.uid, rid)
                res.json({ success: true });
            }
        }
        if (!res.headersSent) {
            res.json({ success: false });
        }
    })
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
    // get the user infomation
    db.getFavRoomId(req.user.uid).then(rid => { return db.getRoomName(rid.rid) })
    .then(roomName => {
        // set favourite room
        req.user.favRoom = roomName
        // render from req.users perspective
        req.user.renderingUser = req.user
        return db.dbLnk.all("SELECT room_name FROM Room", (err, rooms) => {
            res.render("user_dashboard.ejs", { user: req.user, rooms });
        })
    })
});

app.use(Utils.notFound)

// accept connections on loopback port "port"
server.listen(port, "0.0.0.0", () => {
    console.log("Visit http://127.0.0.1:" + port.toString() + " in your browser to view the app.");
});