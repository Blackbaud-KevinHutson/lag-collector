const expressServer = require('./lib/express');
const sql = require('./lib/sql');
// const { AsyncSubject, Observable, Subject, ReplaySubject, from, of, range } = require('rxjs');

// WIP -> retrieve the damned data we already have!!

//let all_rows = [];

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
//console.log('Started.');


