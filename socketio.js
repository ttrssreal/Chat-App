//.env setup
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const
    socketio = require('socket.io'),
    cookie = require('cookie'),
    cookieParser = require('cookie-parser'),
    // A library to help with HTML/js sanitization
    createDOMPurify = require("dompurify"),
    { JSDOM } = require("jsdom");


class SocketIOHelper {
    constructor(server, store) {
        // Sanitization, helps prevent XSS, CSRF, SSRF and attacks of that nature
        this.DOMPurify = createDOMPurify(new JSDOM('').window);
        
        this.store = store;
        this.secret = process.env.SECRET;
        // get the common database connection
        this.db = require("./database.js");
        this.io = socketio(server);
        this.io.use(this.getUserFromStore())
        this.setHandlers()
    }
    
    getUserFromStore() {
        // Takes and decrypts the raw cookie. Then looks up the server-side session object in the session store
        return async (socket, next) => {
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

                // Then with the uid, get the latest user object and prepare it to use
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
        this.io.on("connection", async socket => {
            // User didn't pass authentication
            if (!socket.user || !socket.user.current_rid) { socket.disconnect(); return; }

            let user = socket.user;
            let rid = user.current_rid;
            let room = rid.toString();

            // Join the sub-room rid
            socket.join(room);

            await this.db.incrementRmsJnd(user.uid);

            // Inform the client of its username
            socket.emit("username", user.username);

            this.db.getRoomCurrUsers(rid)
            .then(async currUids => {
                let usernames = []
                for (let i = 0; i < currUids.length; i++) {
                    const element = currUids[i];
                    // add username and uid for each user
                    usernames.push({username: await this.db.getUsername(element.uid), uid: element.uid});
                }
                // Inform the client of the users
                socket.emit("usernames", usernames)
            })
            
            // Inform all other users in the room of the new user
            socket.to(room).emit("user_joined", { username: user.username, uid: user.uid });

            // Relay all messages from the client to the rest of the room
            socket.on("message", message => {
                this.db.incrementMsgsSent(user.uid)
                .then(() => {
                    // Sanitize the message
                    let msg = this.DOMPurify.sanitize(message.message);
                    // Append the username
                    socket.to(room).emit("message", { message: user.username + ": " + msg });
                });
            });
            
            socket.on("disconnect", () => {
                // Inform other users of the disconnection
                socket.to(room).emit("user_left", { username: user.username, uid: user.uid });
                // Nullify the database entry
                this.db.addUserTooRoom(null, user.uid);
            })
    
        })
    }
} // SocketIOHelper

// Export the SocketIOHelper class
module.exports = SocketIOHelper;