const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const 
    QusernameExist = "SELECT uid FROM User WHERE username=?",
    QemailExist = "SELECT uid FROM User WHERE email=?",
    QgetUsername = "SELECT username FROM User WHERE uid=?",
    QgetHash = "SELECT password FROM User WHERE username=?",
    QgetUser = "SELECT * FROM User WHERE username=?",
    QaddUser = "INSERT INTO User (username, password, email, msgs_sent_today, msgs_sent_total, rooms_joined_total) VALUES (?, ?, ?, 0, 0, 0)"



// make queries in varibales up here ^
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
            }).catch(err => {
                rej(err);
            });
        });
    };
    
    emailExist(email) {
        return new Promise((res, rej) => {
            this.exec_query(QemailExist,
            [email])
            .then(rows => {
                rows ? res(true) : res(false);
            }).catch(err => {
                rej(err);
            });
        });
    };
    
    getMultiple(...querys) {
        return Promise.all(querys.map(this.exec_query));
    };
    
    getInfo(table, selector, value, ...info) {
        return Promise.all(info.map(nameOfFeild => {
            return new Promise((res, rej) => {
                this.exec_query("SELECT ? FROM ? WHERE ?=?",
                [nameOfFeild, table, selector, value])
                .then(rows => {
                    res(rows);
                }).catch(err => {
                    rej(err);
                });
            });
        }));
    };

    getRoomName(roomId) {
        return new Promise((res, rej) => {
            this.exec_query("SELECT room_name FROM Room WHERE rid=?",
            [roomId])
            .then(rows => {
                res(rows);
            }).catch(err => {
                rej(err);
            });
        });
    };
    
    getRoomCurrUsers(roomId) {
        return new Promise((res, rej) => {
            this.exec_query("SELECT uid FROM User WHERE current_rid = ?",
            [roomId])
            .then(rows => {
                res(rows);
            }).catch(err => {
                rej(err);
            });
        });
    };
    
    addUserTooRoom(roomId, username) {
        return new Promise((res, rej) => {
            this.exec_query("UPDATE User SET current_rid=? WHERE uid = (SELECT uid FROM User WHERE username=?);",
            [roomId, username])
            .then(() => {
                res();
            })
            .catch(err => {
                rej(err);
            });
        });
    };
    
    removeUserFromRoom(username) {
        return new Promise((res, rej) => {
            this.exec_query("UPDATE User SET current_rid = NULL WHERE uid = (SELECT uid FROM User WHERE username=?)",
            [username])
            .then(() => {
                res();
            }).catch(err => {
                rej(err);
            });
        });
    };
    
    getUsersCurrRoom(username) {
        return new Promise((res, rej) => {
            this.exec_query("SELECT current_rid FROM User WHERE uid = (SELECT uid FROM User WHERE username=?)",
            [username])
            .then(rows => {
                res(rows);
            }).catch(err => {
                rej(err);
            });
        });
    };
    
    setUsersCurrRoom(roomId, username) {
        return new Promise((res, rej) => {
            this.exec_query("UPDATE User SET current_rid=? WHERE uid = (SELECT uid FROM User WHERE username=?)",
            [roomId, username])
            .then(rows => {
                res(rows);
            }).catch(err => {
                rej(err);
            });
        });
    };
    
    getUsername(uid) {
        return new Promise((res, rej) => {
            this.exec_query(QgetUsername,
            [uid])
            .then(rows => {
                rows ? res(rows["username"]) : res(false)
            }).catch(err => {
                rej(err);
            });
        });
    };
    
    databaseCredsFormatValid(creds) {
        let regexUsername = /^[a-zA-z\d]{4,}$/i;
        let regexPassword = /^(?=.*\d)[a-zA-z\d]{8,}/;
        let regexEmail = /[\w/d!#$%&'*+-/=?^`{|}~]+@[a-z\d\-]+.[a-z\d\-]+.[a-z\d\-]+/;
        var valid = {
            username: false,
            password: false,
            email: false
        }
        if (creds) {
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
        }
        return false
    };
    
    databaseCredsCorrect(creds) {
        return new Promise((res, rej) => {
            this.usernameExist(creds["username"])
            .then(result => {
                if (result)
                    return this.exec_query(QgetUser,
                    [creds["username"]])
                res(false);
            })
            .then(rows => {
                bcrypt.compare(creds["password"], rows["password"], 
                (err, result) => {
                    result ? res(rows) : res(false);
                });
            })
            .catch(err => {
                rej(err)
            });
        });
    };

    getUser(uid) {
        return new Promise((res, rej) => {
            this.getUsername(uid)
            .then(uName => {
                if (uName) return this.exec_query(QgetUser,
                [uName])
                return false
            }).then(res)
            .catch(err => {
                rej(err);
            });
        });
    };
    
    addUser(creds) {
        return new Promise((res, rej) => {
            this.usernameExist(creds["username"])
            .then(uExist => {
                if(!uExist) {
                    bcrypt.hash(creds["password"], 12, (err, passwdHash) => {
                        this.exec_query(QaddUser,
                        [creds["username"], passwdHash, creds["email"]])
                        .then(rows => {
                            res(true);
                        }).catch(err => {
                            rej(err);
                        });
                    });
                }
            }).catch(err => {
                rej(err);
            });
        });
    };
};

module.exports = Database;