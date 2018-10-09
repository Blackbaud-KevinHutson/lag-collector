const expressServer = require('./lib/express');
const sql = require('./lib/sql');
const PropertiesReader = require('properties-reader');
let properties = PropertiesReader('settings.properties');
let dbFilePath = properties.get('main.db.file.path');

function sendDataToServer(all_rows) {
  //console.log('$$$ lagRows=' + JSON.stringify(all_rows));

  // Start express server
  expressServer.start(all_rows);
  console.log('Refreshed server.');
}

function start() {
  // Fetch latest data
 sql.query_lag(dbFilePath, sendDataToServer);
}

start();


