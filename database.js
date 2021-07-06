const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

var db = new sqlite3.Database("./database/database.db");
var funcs = {};

funcs.exec_query = (query, params) => {
    return new Promise((res, rej) => {
        if (params) {
            db.get(query, params, (err, rows) => {
                if (err)
                    rej(err);
                else {
                    res(rows);
                }
            });
        } else {
            db.get(query, [], (err, rows) => {
                if (err)
                    rej(err);
                else {
                    res(rows);
                }
            });
        }
    });
};

funcs.usernameExist = username => {
    
    return new Promise((res, rej) => {
        funcs.exec_query("SELECT * FROM User WHERE username=?", [username])
        .then(rows => {
            if (rows)
                res(true);
            else res(false);
        }).catch(err => {
            rej(err);
        });
    });
};

funcs.emailExist = email => {
    // Vunerable
    return new Promise((res, rej) => {
        funcs.exec_query("SELECT * FROM User WHERE email='" + email + "'")
        .then(rows => {
            if (rows[0])
                res(true);
            else res(false);
        }).catch(err => {
            rej(err);
        });
    });
};

funcs.getMultiple = (...querys) => {
    return Promise.all(querys.map(funcs.exec_query));
};

funcs.getInfo = (table, selector, value, ...info) => {
    return Promise.all(info.map(nameOfFeild => {
        return new Promise((res, rej) => {
            var query = "SELECT "+nameOfFeild+ " FROM " +table+ " WHERE " +selector+ "='"+value+"'";
            funcs.exec_query(query).then(rows => {
                res(rows);
            }).catch(err => {
                rej(err);
            });
        });
    }));
};

funcs.getRoomName = roomId => {
    return new Promise((res, rej) => {
        funcs.exec_query("SELECT room_name FROM Room WHERE rid = "+roomId)
        .then(rows => {
            res(rows);
        }).catch(err => {
            rej(err);
        });
    });
};

funcs.getRoomCurrUsers = roomId => {
    return new Promise((res, rej) => {
        funcs.exec_query("SELECT uid FROM User WHERE current_rid = "+roomId)
        .then(rows => {
            res(rows);
        }).catch(err => {
            rej(err);
        });
    });
};

funcs.addUserTooRoom = (roomId, username) => {
    return new Promise((res, rej) => {
        funcs.exec_query("UPDATE User SET current_rid = "+roomId+" WHERE uid = (SELECT uid FROM User WHERE username = '"+username+"');")
        .then(() => {
            res();
        })
        .catch(err => {
            rej(err);
        });
    });
};

funcs.removeUserFromRoom = username => {
    return new Promise((res, rej) => {
        funcs.exec_query("UPDATE User SET current_rid = NULL WHERE uid = (SELECT uid FROM User WHERE username = '"+username+"');")
        .then(() => {
            res();
        }).catch(err => {
            rej(err);
        });
    });
};

funcs.getUsersCurrRoom = username => {
    return new Promise((res, rej) => {
        funcs.exec_query("SELECT current_rid FROM User WHERE uid = (SELECT uid FROM User WHERE username = '"+username+"');")
        .then(rows => {
            res(rows);
        }).catch(err => {
            rej(err);
        });
    });
};

funcs.setUsersCurrRoom = (roomId, username) => {
    return new Promise((res, rej) => {
        funcs.exec_query("UPDATE User SET current_rid = "+roomId+" WHERE uid = (SELECT uid FROM User WHERE username = '"+username+"');")
        .then(rows => {
            res(rows);
        }).catch(err => {
            rej(err);
        });
    });
};

funcs.getUsername = uid => {
    return new Promise((res, rej) => {
        funcs.exec_query("SELECT username FROM User WHERE uid = "+uid)
        .then(rows => {
            res(rows[0]["username"]);
        }).catch(err => {
            rej(err);
        });
    });
};

funcs.databaseCredsFormatValid = creds => {
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

funcs.databaseCredsValid = creds => {
    return new Promise((res, rej) => {
        funcs.usernameExist(creds["username"]).then(result => {
            if (result) {
                funcs.exec_query("SELECT password FROM User WHERE username='" + creds["username"] + "'").then(rows => {
                    bcrypt.compare(creds["password"], rows[0]["password"], (err, result) => {
                        if (result)
                            res();
                        else rej();
                    });
                });
            } else
                rej();
        }).catch(err => {
            rej(err)
        });
    });
};

funcs.addUser = creds => {
    return new Promise((res, rej) => {
        funcs.usernameExist(creds["username"]).then(() => {
            console.log(err)
            rej(err);
        }).catch(err => {
            bcrypt.hash(creds["password"], 12, (err, passwdHash) => {
                funcs.exec_query("INSERT INTO User (username, password, email, msgs_sent_today, msgs_sent_total, " +
                    "rooms_joined_total) VALUES ('" + creds["username"] + "', '"+ passwdHash +"', '" + creds["email"] + "'," +
                    " 0, 0, 0)")
                    .then(rows => {
                        res(rows);
                }).catch(err => {
                    rej(err);
                });
            });
        })
    });
};

module.exports = funcs;