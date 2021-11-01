const router = require("express").Router();
const db = require("../database.js");
Utils = new (require("../utils.js"))();

// Register room route handler
router.get('/', Utils.isAuth, (req, res) => {
    // check for if there is a parameter supplied
    if (Object.entries(req.query).length == 0) { Utils.notFound(req, res); return; }
    db.addUserTooRoom(req.query.roomid, req.user.uid)
    .then(async rid => {
        if ((await db.getFavRoomId(req.user.uid)).rid == rid) {
            req.user.favourite = true;
        }
        // getRoomName
        return db.getRoomName(rid);
    }).then(rName => {
        // check for if the room exists
        if (!rName) { Utils.notFound(req, res); return; }
        res.render("room.ejs", {
            // req.user exists because route uses Utils.isAuth
            user: req.user,
            room_name: rName.room_name,
        });
    }).catch(err => { console.log(err) })
});

router.get('/rooms', Utils.isAuth, async (req, res) => {
    res.render("rooms.ejs", { user: req.user, rooms: await db.getRooms() })
});

module.exports = router;