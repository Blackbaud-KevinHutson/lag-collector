const lagParser = require('./lib/parse_lag');
const sql = require('./lib/sql');
var Queue = require('better-queue');
let PropertiesReader = require('properties-reader');
var _ = require('lodash');

let properties = PropertiesReader('settings.properties');
let lagDir = properties.get('main.lag.files.dir');

// Perform a database save for each task's "completion"
function task_done(err,result) {
  sql.save_lag(result);
}

// parse and feed it some data, using Queue to slow down the processing 
// using `afterProcessDelay` so that our sqlite3 database can handle it.
function process_lag_results(lagDir) {
  var q = new Queue((input, cb) => {
    //console.log('processing...input='+input);
    cb(null, input);
  }, { afterProcessDelay: 200 });
  
  let obs = lagParser.parse_lag(lagDir);
  _.forEach(obs, function(lag_observable) {
    lag_observable.subscribe(x => {
        q.push(x, task_done);
    });
  });
  // FIXME need an action here to move or delete the files when we are done so we 
  // dont process them twice
}

process_lag_results(lagDir);
// FIXME determine how we are "done", avoid race conditions and (use another queue?) clear directory of files when complete
console.log('done!');
