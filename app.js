const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use("/public", express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));;
app.set('view engine', 'ejs');

const port = 5000;

app.get('/', (req, res) => {
    res.render("index.ejs");
});

app.get('/room', (req, res) => {
    res.render("room.ejs", {
        room_number: req.query.num
    });
});

app.listen(port, () => {
    console.log("listening on " + port.toString());
});