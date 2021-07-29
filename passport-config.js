const LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport, db) {
    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });

    passport.use(new LocalStrategy({}, (username, password, done) => {
        db.databaseCredsValid({username, password}).then(uid => {
            if (uid) {
                done(null, uid);
            }
            done(null, false, { message: "Something Went Wrong." });
            // console.log(true);
        }).catch(() => {
            done(null, false, { message: "Username or Password Incorrect." });
            // console.log(false);
        });
    }));
};