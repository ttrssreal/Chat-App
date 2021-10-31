const router = require("express").Router();
const db = require("../database.js");
Utils = new (require("../utils.js"))();

// Register room route handler
router.get('/', Utils.isAuth, (req, res) => {
    db.addUserTooRoom(req.query.roomid, req.user.uid)
    .then(async rid => {
        if ((await db.getFavRoomId(req.user.uid)).rid == rid) {
            req.user.favourite = true;
        }
        // getRoomName
        return db.getRoomName(rid);
    }).then(rName => {
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