const LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport, db) {
    passport.serializeUser((user, done) => { done(null, user); });
    passport.deserializeUser((user, done) => { done(null, user); });

    passport.use(new LocalStrategy({}, (username, password, done) => {
        db.databaseCredsCorrect({username, password})
        .then(user => {
            user ? done(null, user) : done(null, false, { message: "Username or Password Incorrect." });
        }).catch(err => {
            done(err);
        });
    }));
};