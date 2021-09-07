class Utils {
    isAuth(req, res, next) {
        req.isAuthenticated() ? next() : res.redirect("/login")
    }

    updateUser(db) {
        return (req, res, next) => {
            if (req.isAuthenticated())
                db.getUser(req.user.uid)
                .then(user => { req.user = user; })
                .then(() => { next() });
            else next();
        }
    }
}

module.exports = Utils;