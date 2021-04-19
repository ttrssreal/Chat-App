const sqlite3 = require("sqlite3").verbose();

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
    let regexPassword = /^(?=[^a-z]*[a-z])(?=\D*\d)[^:&.~\s]{8,100}$/;
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
                if (creds["password"] == rows[0]["password"])
                    callback(true);
                else callback(false);
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
    exec_query("INSERT INTO User (username, password, email) VALUES ('" + creds["username"] + "', '"+ creds["password"] +"', '" + creds["email"] + "')", rows => {
        callback(rows);
    });
}

module.exports = {
    exec_query: exec_query,
    databaseCredsFormatValid: databaseCredsFormatValid,
    databaseCredsValid: databaseCredsValid,
    userExist: userExist,
    addUser: addUser
};