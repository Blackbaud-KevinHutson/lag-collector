const expressServer = require('./lib/express');
const sql = require('./lib/sql');

function sendDataToServer(all_rows) {
  //console.log('$$$ lagRows=' + JSON.stringify(all_rows));

  // Start express server
  expressServer.start(all_rows);
  console.log('Refreshed server.');
}

function start() {
  // Fetch latest data
 sql.query_lag(sendDataToServer);
}

start();


