const sqlite3 = require("sqlite3").verbose();
// the crypto library
const bcrypt = require("bcrypt");

//.env setup
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// Useful sql queries
const 
    QusernameExist = "SELECT uid FROM User WHERE username=?",
    QemailExist = "SELECT uid FROM User WHERE email=?",
    QgetUsername = "SELECT username FROM User WHERE uid=?",
    QgetHash = "SELECT password FROM User WHERE username=?",
    QgetUser = "SELECT * FROM User WHERE username=?",
    QaddUser = "INSERT INTO User (username, password, email, msgs_sent_total, rooms_joined_total) VALUES (?, ?, ?, 0, 0)",
    QgetFavRoomId = "SELECT rid FROM User INNER JOIN FavouriteRoom ON User.uid = FavouriteRoom.uid WHERE User.uid=?",
    QinsertFavourite = "INSERT OR IGNORE INTO FavouriteRoom (uid, rid) VALUES (?, ?)",
    QupdateFavourite = "UPDATE FavouriteRoom SET rid=? WHERE uid=?"

// A class for interacting with the database
class Database {
    constructor(dbRelLoc) {
        this.dbLnk = new sqlite3.Database(dbRelLoc);
    }
    
    /*
        This is a wrapper around the default sqlite3 get function.
        query: sqlite query to execute
        params: an array of parameters to be replaced
    */
    exec_query(query, params) {
        return new Promise((res, rej) => {
            this.dbLnk.get(query, params ? params : [],
                (err, rows) => {
                err ? rej(err) : res(rows);
            });
        });
    };

    /**
     * Checks if the username exists.
     * 
     * @param {string} username 
     * @returns {boolean}
     */
    usernameExist(username) {
        return new Promise((res, rej) => {
            this.exec_query(QusernameExist,
            [username])
            .then(rows => {
                rows ? res(true) : res(false);
            }).catch(err => rej(err) );
        });
    };

    /**
     * Checks if the email exists.
     * 
     * @param {string} email 
     * @returns {boolean}
     */
    emailExist(email) {
        return new Promise((res, rej) => {
            this.exec_query(QemailExist,
            [email])
            .then(rows => {
                rows ? res(true) : res(false);
            }).catch(err => rej(err) );
        });
    };

    /**
     * Fufills many querys and returns all the resolutions.
     * 
     * @param {string} username 
     * @returns {Array.<any>} rows
     */
    getMultiple(...querys) {
        return Promise.all(querys.map(this.exec_query));
    };

    /**
     * Gets the specified user infomation.
     * 
     * @param {string} table What table to get from.
     * @param {string} selector What feild to look in.
     * @param {string} value What value to look for.
     * @returns {Array.<any>} The Infomation.
     */
    getInfo(table, selector, value, ...info) {
        // Makes a promise for each query and executes them asynchronously
        return Promise.all(info.map(nameOfFeild => {
            return new Promise((res, rej) => {
                this.exec_query("SELECT ? FROM ? WHERE ?=?",
                [nameOfFeild, table, selector, value])
                .then(rows => {
                    res(rows);
                }).catch(err => rej(err) );
            });
        }));
    };

    /**
     * Gets a rooms name.
     * 
     * @param {int} roomId 
     * @returns {Array.<string>} The room name.
     */
    getRoomName(roomId) {
        return new Promise((res, rej) => {
            this.exec_query("SELECT room_name FROM Room WHERE rid=?",
            [roomId])
            .then(rows => {
                res(rows);
            }).catch(err => rej(err) );
        });
    };

    /**
     * Returns all the rooms.
     * 
     * @returns {Array.<string>} rooms.
     */
    getRooms() {
        return new Promise((res, rej) => {
            this.dbLnk.all("SELECT * FROM Room", async (err, rooms) => {
                res(rooms);
            })
        });
    };

    /**
     * Gets the users in a room.
     * 
     * @param {int} roomId 
     * @returns {Array.<int>} uids.
     */
    getRoomCurrUsers(roomId) {
        return new Promise((res, rej) => {
            this.dbLnk.all("SELECT uid FROM User WHERE current_rid = ?;",
            [roomId], (err, rows) => {
                err ? rej(err) : res(rows)
            })
        });
    };

    /**
     * Adds uid to a room.
     * 
     * @param {int} roomId 
     * @returns {Array.<int>} uids.
     */
    addUserTooRoom(roomId, uid) {
        return new Promise((res, rej) => {
            this.exec_query("UPDATE User SET current_rid=? WHERE uid=?;",
            [roomId, uid])
            .then(() => {
                res(roomId);
            }).catch(err => rej(err) );
        });
    };

    /**
     * Gets the favourite room of a user.
     * 
     * @param {int} uid 
     * @returns {Array.<int>|boolean} uids or false.
     */
    getFavRoomId(uid) {
        return new Promise((res, rej) => {
            this.exec_query(QgetFavRoomId, [uid])
            .then(rows => {
                rows ? res(rows) : res(false);
            }).catch(err => rej(err) );
        });
    };

    /**
     * Clears all the rooms of users.
     * 
     * @returns {Array.<int>|boolean} uids or false.
     */
    clearRooms() {
        return new Promise((res, rej) => {
            this.exec_query("UPDATE User SET current_rid=NULL;")
            .then(rows => {
                rows ? res(rows) : res(false);
            }).catch(err => rej(err) );
        });
    };

    /**
     * Sets the favourite room of a user.
     * 
     * @param {int} uid 
     * @param {int} roomId
     * @returns {Array.<int>} uids.
     */
    setFavRoomId(uid, roomId) {
        return new Promise((res, rej) => {
            this.getFavRoomId(roomId)
            .then(rid => {
                if (!rid) {
                    this.exec_query(QinsertFavourite, [uid, roomId]).then(res);
                }
                return;
            })
            .then(this.exec_query(QupdateFavourite, [roomId, uid]))
            .catch(err => rej(err) );
        });
    };

    /**
     * Adds one to the number of messages sent by a user.
     * 
     * @param {int} uid 
     * @returns {boolean} succeded?.
     */
    incrementMsgsSent(uid) {
        return new Promise((res, rej) => {
            this.exec_query("UPDATE User SET msgs_sent_total = msgs_sent_total + 1 WHERE uid=?", [uid]
            ).then(() => {
                res(true);
            }).catch(() => rej(err) )
        });
    };

    /**
     * Adds one to the number of rooms joined by a user.
     * 
     * @param {int} uid 
     * @returns {boolean} succeded?.
     */
    incrementRmsJnd(uid) {
        return new Promise((res, rej) => {
            this.exec_query("UPDATE User SET rooms_joined_total = rooms_joined_total + 1 WHERE uid=?", [uid]
            ).then(() => {
                res(true);
            }).catch(() => rej(err) )
        });
    };

    /**
     * Gets a username from a uid.
     * 
     * @param {int} uid 
     * @returns {string|boolean} username or failed.
     */
    getUsername(uid) {
        return new Promise((res, rej) => {
            this.exec_query(QgetUsername, [uid])
            .then(rows => {
                rows ? res(rows["username"]) : res(false)
            }).catch(err => rej(err) );
        });
    };

    /**
     * Check if the format of the credentials in correct.
     * 
     * @param {{username: string, password: string, email:string}} creds 
     * @returns {{username: boolean, password: boolean, email:boolean}|boolean} specific faliure points of if they all failed then false.
     */
    databaseCredsFormatValid(creds) {
        // Regex for format validation
        let regexUsername = /^[a-zA-z\d]{4,}$/i;
        let regexPassword = /^(?=.*\d)[a-zA-z\d]{8,}/;
        let regexEmail = /^[\w\d!#$%&'*+-\/=?^`{|}~]+@[a-z\d\-]+.[a-z\d\-]+.[a-z\d\-]+$/;
        // An object to store what passed and didn't
        var valid = {
            username: false,
            password: false,
            email: false
        }
        // Null check
        if (!creds) return false

        // Either returns all true or partially true
        if (regexUsername.test(creds["username"]))
            valid["username"] = true;
        if (regexPassword.test(creds["password"])) 
            valid["password"] = true;
        if (regexEmail.test(creds["email"])) 
            valid["email"] = true;
        if (valid["username"] && valid["password"] && valid["email"])
            return true;
        else
            return valid;
    };

    /**
     * Checks if the credentials are acctually in the database and match.
     * 
     * @param {{username: string, password: string, email:string}} creds 
     * @returns {{username: boolean, password: boolean, email:boolean}|boolean} specific faliure points of if they all failed then false.
     */
    databaseCredsCorrect(creds) {
        return new Promise((res, rej) => {
            // usernameExist
            this.usernameExist(creds["username"])
            .then(result => {
                if (result)
                    // getUser
                    return this.exec_query(QgetUser,
                    [creds["username"]])
                res(false);
            })
            .then(rows => {
                // Hashes arg1 and compares with arg2
                bcrypt.compare(creds["password"], rows["password"], 
                (err, result) => {
                    result ? res(rows) : res(false);
                });
            }).catch(err => rej(err) );
        });
    };

    /**
     * Check if the format of the credentials in correct.
     * 
     * @param {int} uid 
     * @returns {{username: string, uid: string ...}|boolean} user jsobject or false.
     */
    getUser(uid) {
        return new Promise((res, rej) => {
            this.getUsername(uid)
            .then(uName => {
                if (uName) return this.exec_query(QgetUser,
                [uName])
                return false
            }).then(res).catch(err => rej(err) );
        });
    };

    /**
     * Adds the user to the database.
     * 
     * @param {{username: string, password: string, email:string}} creds 
     * @returns {boolean} success?
     */
    addUser(creds) {
        return new Promise((res, rej) => {
            // usernameExist
            this.usernameExist(creds["username"])
            .then(uExist => {
                // Username dosen't exist
                if(!uExist) {
                    // Performs a hash with 12 rounds on the password
                    bcrypt.hash(creds["password"], 12, (err, passwdHash) => {
                        // Inserts the hash and email into the database
                        this.exec_query(QaddUser,
                        [creds["username"], passwdHash, creds["email"]])
                        .then(rows => {
                            res(true);
                        }).catch(err => rej(err) );
                    });
                }
            }).catch(err => rej(err) );
        });
    };
}; // Database

// create a singleton (sort of)
const dbConn = new Database(process.env.DBLOCATION)

// Export the object
module.exports = dbConn;