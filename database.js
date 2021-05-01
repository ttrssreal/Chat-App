const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

var db = new sqlite3.Database("./database/database.db"); 

const exec_query = (query, callback) => {
    db.all(query, (err, rows) => {
        if (err)
            callback(false);
        else
            callback(rows);
    });
}

const databaseCredsFormatValid = (creds) => {
    let regexUsername = /^[a-z][^\W_]{4,29}$/i;
    let regexPassword = /^(?=[^a-z]*[a-z])(?=\D*\d)[^:&.~\s]{8,1000}$/;
    let regexEmail = /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/;
    let usernameValid, passwordValid, emailValid = false;
    if (creds) {
        if (regexUsername.test(creds["username"]))
            usernameValid = true;
        if (regexPassword.test(creds["password"])) 
            passwordValid = true;
        if (regexEmail.test(creds["email"])) 
            emailValid = true;
        if (usernameValid && passwordValid && emailValid) 
            return true;
        else 
            return false;
    } else {
        return false
    }
}

const databaseCredsValid = (creds, callback) => {
    userExist(creds["username"], exsists => {
        if (exsists) {
            exec_query("SELECT password FROM User WHERE username='" + creds["username"] + "'", rows => {
                bcrypt.compare(creds["password"], rows[0]["password"], (err, result) => {
                    if (result)
                        callback(true);
                    else callback(false);
                });
            });
        } else {
            callback(false);
        }
    });
}

const userExist = (username, callback) => {
    // Vunerable
    exec_query("SELECT * FROM User WHERE username='" + username + "'", rows => {
        if (rows[0])
            callback(true);
        else callback(false);
    });
}

const addUser = (creds, callback) => {
    bcrypt.hash(creds["password"], 12, (err, passwdHash) => {
        exec_query("INSERT INTO User (username, password, email, msgs_sent_today, msgs_sent_total, " +
            "rooms_joined_total) VALUES ('" + creds["username"] + "', '"+ passwdHash +"', '" + creds["email"] + "'," +
            " 0, 0, 0)", rows => {
            callback(rows);
        });
    });
}

module.exports = {
    exec_query: exec_query,
    databaseCredsFormatValid: databaseCredsFormatValid,
    databaseCredsValid: databaseCredsValid,
    userExist: userExist,
    addUser: addUser
};