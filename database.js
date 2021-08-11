const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

class Database {
    constructor(dbRelLoc) {
        this.dbLnk = new sqlite3.Database(dbRelLoc);
    }
    
    exec_query(query, params) {
        return new Promise((res, rej) => {
            this.dbLnk.get(query, params ? params : [], (err, rows) => {
                err ? rej(err) : res(rows);
            });
        });
    };
    
    usernameExist(username) {
        return new Promise((res, rej) => {
            this.exec_query("SELECT * FROM User WHERE username=?", [username])
            .then(rows => {
                rows ? res(true) : res(false);
            }).catch(err => {
                rej(err);
            });
        });
    };
    
    emailExist(email) {
        return new Promise((res, rej) => {
            this.exec_query("SELECT * FROM User WHERE email=?", [email])
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
                this.exec_query("SELECT ? FROM ? WHERE ?=?", [nameOfFeild, table, selector, value])
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
            this.exec_query("SELECT room_name FROM Room WHERE rid=?", [roomId])
            .then(rows => {
                res(rows);
            }).catch(err => {
                rej(err);
            });
        });
    };
    
    getRoomCurrUsers(roomId) {
        return new Promise((res, rej) => {
            this.exec_query("SELECT uid FROM User WHERE current_rid = ?", [roomId])
            .then(rows => {
                res(rows);
            }).catch(err => {
                rej(err);
            });
        });
    };
    
    addUserTooRoom(roomId, username) {
        return new Promise((res, rej) => {
            this.exec_query("UPDATE User SET current_rid=? WHERE uid = (SELECT uid FROM User WHERE username=?);", [roomId, username])
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
            this.exec_query("UPDATE User SET current_rid = NULL WHERE uid = (SELECT uid FROM User WHERE username=?)", [username])
            .then(() => {
                res();
            }).catch(err => {
                rej(err);
            });
        });
    };
    
    getUsersCurrRoom(username) {
        return new Promise((res, rej) => {
            this.exec_query("SELECT current_rid FROM User WHERE uid = (SELECT uid FROM User WHERE username=?)", [username])
            .then(rows => {
                res(rows);
            }).catch(err => {
                rej(err);
            });
        });
    };
    
    setUsersCurrRoom(roomId, username) {
        return new Promise((res, rej) => {
            this.exec_query("UPDATE User SET current_rid=? WHERE uid = (SELECT uid FROM User WHERE username=?)", [roomId, username])
            .then(rows => {
                res(rows);
            }).catch(err => {
                rej(err);
            });
        });
    };
    
    getUsername(uid) {
        return new Promise((res, rej) => {
            this.exec_query("SELECT username FROM User WHERE uid=?", [uid])
            .then(rows => {
                if (rows) {
                    res(rows["username"]);
                } else res(null)
                res("admin");
            }).catch(err => {
                rej(err);
            });
        });
    };
    
    databaseCredsFormatValid(creds) {
        let regexUsername = /^[a-z][^\W_]{4,29}$/i;
        let regexPassword = /^(?=[^a-z]*[a-z])(?=\D*\d)[^:&.~\s]{8,1000}$/;
        let regexEmail = /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/;
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
        } else {
            return false
        }
    };
    
    databaseCredsCorrect(creds) {
        return new Promise((res, rej) => {
            this.usernameExist(creds["username"])
            .then(result => {
                if (result)
                    return this.exec_query("SELECT * FROM User WHERE username=?", [creds["username"]])
                res(false);
            })
            .then(rows => {
                bcrypt.compare(creds["password"], rows["password"], (err, result) => {
                    result ? res(rows) : res(false);
                });
            })
            .catch(err => {
                rej(err)
            });
        });
    };
    
    addUser(creds) {
        return new Promise((res, rej) => {
            this.usernameExist(creds["username"])
            .then(uExist => {
                if(!uExist) {
                    bcrypt.hash(creds["password"], 12, (err, passwdHash) => {
                        this.exec_query(`INSERT INTO User 
                        (username, password, email, msgs_sent_today, 
                        msgs_sent_total, rooms_joined_total) 
                        VALUES (?, ?, ?, 0, 0, 0)`,
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