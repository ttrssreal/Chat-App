// Utils is a class of express middleware functions

class Utils {
    // Require a valid session to proceed to a route or the user is redirected;
    isAuth(req, res, next) {
        req.isAuthenticated() ? next() : res.redirect("/login")
    }

    // Fetches most recent user infomation and stores it in the session
    updateUser(db) {
        return (req, res, next) => {
            // Auth check
            if (req.isAuthenticated())
                db.getUser(req.user.uid)
                // Pepares the request.user object
                .then(user => { req.user = user; })
                // Next middleware
                .then(() => { next() });
            else next();
        }
    }
}

// Export Utill class
module.exports = Utils;