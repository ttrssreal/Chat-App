// Authorization strategy
const LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport, db) {
    // Register functions to deal with serialization of user data for storage in a server-side session. 
    // They just return there arguments.
    passport.serializeUser((user, done) => { done(null, user); });
    passport.deserializeUser((user, done) => { done(null, user); });

    // Register the strategy with a verification function.
    passport.use(new LocalStrategy({}, (username, password, done) => {
        // databaseCredsCorrect (refer to database.js)
        db.databaseCredsCorrect({username, password})
        .then(user => {
            user ? done(null, user) : done(null, false, { message: "Username or Password Incorrect." });
        }).catch(err => { done(err) });
    }));
};