let express = require('express');
let path = require('path');

function start(lag_data) {
    let app = express();
    app.use(express.static('public'));
    app.get('/', (req, res) => {
        res.sendFile(path.dirname(module.parent.filename) + '/public/index.htm');
    })
    app.listen(3000);
}

module.exports = { start };