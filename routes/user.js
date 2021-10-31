const router = require("express").Router();
const db = require("../database.js");
Utils = new (require("../utils.js"))();

router.get("/:id", Utils.isAuth, async (req, res) => {
    let user = await db.getUser(req.params.id);
    if (!user) {
        Utils.notFound(req, res, null);
        return;
    }
    user.favRoom = await db.getRoomName((await db.getFavRoomId(req.params.id)).rid)
    user.renderingUser = req.user;
    res.render("user_dashboard.ejs", { user, rooms: false });
})

module.exports = router;