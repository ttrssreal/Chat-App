const LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport) {
    passport.use(new LocalStrategy({}, (username, password, done) => {
        db.databaseCredsValid({username, password}).then(done(null, username));
    }));
}