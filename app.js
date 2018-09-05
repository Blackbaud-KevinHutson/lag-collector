const restServer = require('./lib/rest');
const sql = require('./lib/sql');
const lagParser = require('./lib/parse_lag');

// Start REST server
// restServer.start();

var database = sql.openDatabase();
sql.doSql(database);
sql.closeDatabase(database);


function process_result(result) {
  console.log('result -> ' + JSON.stringify(result));
}

// parse
// lagParser.parse_lag(process_result);

console.log('done!');


