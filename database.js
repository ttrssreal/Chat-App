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

    exec_query(query, params) {
        return new Promise((res, rej) => {
            this.dbLnk.get(query, params ? params : [],
                (err, rows) => {
                err ? rej(err) : res(rows);
            });
        });
    };
    
    usernameExist(username) {
        return new Promise((res, rej) => {
            this.exec_query(QusernameExist,
            [username])
            .then(rows => {
                rows ? res(true) : res(false);
            }).catch(err => rej(err) );
        });
    };
    
    emailExist(email) {
        return new Promise((res, rej) => {
            this.exec_query(QemailExist,
            [email])
            .then(rows => {
                rows ? res(true) : res(false);
            }).catch(err => rej(err) );
        });
    };
    
    getMultiple(...querys) {
        return Promise.all(querys.map(this.exec_query));
    };
    
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

    getRoomName(roomId) {
        return new Promise((res, rej) => {
            this.exec_query("SELECT room_name FROM Room WHERE rid=?",
            [roomId])
            .then(rows => {
                res(rows);
            }).catch(err => rej(err) );
        });
    };

    getRooms() {
        return new Promise((res, rej) => {
            this.dbLnk.all("SELECT * FROM Room", async (err, rooms) => {
                res(rooms);
            })
        });
    };
    
    getRoomCurrUsers(roomId) {
        return new Promise((res, rej) => {
            this.dbLnk.all("SELECT uid FROM User WHERE current_rid = ?;",
            [roomId], (err, rows) => {
                err ? rej(err) : res(rows)
            })
        });
    };
    
    addUserTooRoom(roomId, uid) {
        return new Promise((res, rej) => {
            this.exec_query("UPDATE User SET current_rid=? WHERE uid=?;",
            [roomId, uid])
            .then(() => {
                res(roomId);
            }).catch(err => rej(err) );
        });
    };

    getFavRoomId(uid) {
        return new Promise((res, rej) => {
            this.exec_query(QgetFavRoomId, [uid])
            .then(rows => {
                rows ? res(rows) : res(false);
            }).catch(err => rej(err) );
        });
    };

    clearRooms() {
        return new Promise((res, rej) => {
            this.exec_query("UPDATE User SET current_rid=NULL;")
            .then(rows => {
                rows ? res(rows) : res(false);
            }).catch(err => rej(err) );
        });
    };

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
    
    incrementMsgsSent(uid) {
        return new Promise((res, rej) => {
            this.exec_query("UPDATE User SET msgs_sent_total = msgs_sent_total + 1 WHERE uid=?", [uid]
            ).then(() => {
                res(true);
            }).catch(() => rej(err) )
        });
    };

    incrementRmsJnd(uid) {
        return new Promise((res, rej) => {
            this.exec_query("UPDATE User SET rooms_joined_total = rooms_joined_total + 1 WHERE uid=?", [uid]
            ).then(() => {
                res(true);
            }).catch(() => rej(err) )
        });
    };
    
    getUsername(uid) {
        return new Promise((res, rej) => {
            this.exec_query(QgetUsername, [uid])
            .then(rows => {
                rows ? res(rows["username"]) : res(false)
            }).catch(err => rej(err) );
        });
    };
    
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

const dbConn = new Database(process.env.DBLOCATION)

// Export the class
module.exports = dbConn;