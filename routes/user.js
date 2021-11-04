/*
    The /user route is made so that users can view one anothers profiles
*/

const router = require("express").Router();
const db = require("../database.js");
// new Utils instance
Utils = new (require("../utils.js"))();

// handles user/ route
router.get("/:id", Utils.isAuth, async (req, res) => {
    let user = await db.getUser(req.params.id);
    // 404 if the user is not found
    if (!user) {
        Utils.notFound(req, res, null);
        return;
    }
    // get the user info
    user.favRoom = await db.getRoomName((await db.getFavRoomId(req.params.id)).rid)
    // render the page from the perspective of the user who made the request
    user.renderingUser = req.user;
    res.render("user_dashboard.ejs", { user, rooms: false });
})

module.exports = router;