const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

var db = new sqlite3.Database("./database/database.db");

const exec_query = query => {
    return new Promise((res, rej) => {
        db.all(query, (err, rows) => {
            if (err)
                rej(err)
            else
                res(rows)
        });
    });
};

const get = (...querys) => {
    return Promise.all(querys.map(exec_query));
};

const getUserInfo = (user, ...info) => {
    return Promise.all(info.map((nameOfFeild) => {
        return new Promise((res, rej) => {
            usernameExist(user).then(() => {
                var query = "SELECT "+nameOfFeild+" FROM User WHERE username='"+user+"'";
                exec_query(query).then(rows => {
                    res(rows);
                }).catch(err => {
                    rej(err);
                });
            }).catch(err => {
                rej(err);
            });
        });
    }));
};

const getRoomCurrUsers = roomName => {
    return new Promise()
};

const databaseCredsFormatValid = creds => {
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

const databaseCredsValid = creds => {
    return new Promise((res, rej) => {
        usernameExist(creds["username"]).then(() => {
                exec_query("SELECT password FROM User WHERE username='" + creds["username"] + "'").then(rows => {
                    bcrypt.compare(creds["password"], rows[0]["password"], (err, result) => {
                        if (result)
                            res();
                        else rej();
                    });
                });
        }).catch(() => {
            rej()
        });
    });
};

const usernameExist = username => {
    // Vunerable
    return new Promise((res, rej) => {
        exec_query("SELECT * FROM User WHERE username='" + username + "'")
        .then(rows => {
            if (rows[0])
                res();
            else rej();
        }).catch(err => {
            rej(err);
        });
    });
};

const emailExist = email => {
    // Vunerable
    return new Promise((res, rej) => {
        exec_query("SELECT * FROM User WHERE email='" + email + "'")
        .then(rows => {
            if (rows[0])
                res();
            else rej();
        }).catch(err => {
            rej(err);
        });
    });
};

const addUser = creds => {
    return new Promise((res, rej) => {
        usernameExist(creds["username"]).then(() => {
            console.log(err)
            rej(err);
        }).catch(err => {
            bcrypt.hash(creds["password"], 12, (err, passwdHash) => {
                exec_query("INSERT INTO User (username, password, email, msgs_sent_today, msgs_sent_total, " +
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

module.exports = {
    exec_query: exec_query,
    get: get,
    getUserInfo: getUserInfo,
    databaseCredsFormatValid: databaseCredsFormatValid,
    databaseCredsValid: databaseCredsValid,
    usernameExist: usernameExist,
    emailExist: emailExist,
    addUser: addUser
};