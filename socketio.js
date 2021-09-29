const
    socketio = require('socket.io'),
    cookie = require('cookie'),
    cookieParser = require('cookie-parser'),
    // A library to help with HTML/js sanitization
    createDOMPurify = require("dompurify"),
    { JSDOM } = require("jsdom");


class SocketIOHelper {
    constructor(server, db, secret, store) {
        // Sanitization, helps prevent XSS, CSRF, SSRF and attacks of that nature
        this.DOMPurify = createDOMPurify(new JSDOM('').window);
        
        this.store = store;
        this.secret = secret;
        this.db = db;
        this.io = socketio(server);
        this.io.use(this.getUserFromStore())
        this.setHandlers()
    }
    
    getUserFromStore() {
        // Takes and decrypts the raw cookie. Then looks up the server-side session object in the session store
        return (socket, next) => {
            // Converts raw string into a js object
            let parsed = cookie.parse(socket.request.headers.cookie);
            // Decrypts the signed cookie with the secret into a session id
            let sid = cookieParser.signedCookie(parsed["connect.sid"], this.secret)
            // Finds the user object in the store
            this.store.get(sid, (err, user) => {
                if (err || !user) {
                    // socket.user is false if the user is not found
                    socket.user = false;
                    next();
                    return;
                }

                // Then with the uid, get the latest user object and prepere it to use
                let uid = user.passport.user.uid;
                this.db.getUser(uid)
                .then(user => {
                    socket.user = user;
                    next();
                })
            });
        }
    }

    setHandlers() {
        this.io.on("connection", socket => {
            // User didn't pass authentication
            if (!socket.user) { socket.disconnect(); return; }

            let user = socket.user;
            let rid = user.current_rid;
            let room = rid.toString();

            // Join the sub-room rid
            socket.join(room);

            // Inform the client of its username
            socket.emit("username", user.username);

            this.db.getRoomCurrUsers(rid)
            .then(currUids => {
                let promises = []
                currUids.forEach(element => {
                    // Get the username of current users in the room
                    promises.push(this.db.getUsername(element.uid))
                });
                Promise.all(promises).then(usernames => {
                    // Inform the client of the users
                    socket.emit("usernames", usernames)
                });
            })
            
            // Inform all other users in the room of the new user
            socket.to(room).emit("user_joined", user.username);

            // Relay all messages from the client to the rest of the room
            socket.on("message", message => {
                                                        // Append the username    // Sanitize the message
                socket.to(room).emit("message", { message: user.username + ": " + this.DOMPurify.sanitize(message.message) });
            });
            
            socket.on("disconnect", () => {
                // Inform other users of the disconnection
                socket.to(room).emit("user_left", user.username);
                // Nullify the database entry
                this.db.addUserTooRoom(null, user.uid);
            })
    
        })
    }
}

// Export the SocketIOHelper class
module.exports = SocketIOHelper;