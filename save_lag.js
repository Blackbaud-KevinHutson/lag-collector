const lagParser = require('./lib/parse_lag');
const sql = require('./lib/sql');
const Queue = require('better-queue');
const PropertiesReader = require('properties-reader');
const _ = require('lodash');
const fileUtils = require('./lib/file_utils');

let properties = PropertiesReader('settings.properties');
let lagDir = properties.get('main.lag.files.dir');

// Perform a database save for each task's "completion"
function save_lag_item(err,result) {
  //console.log('>> saving result='+JSON.stringify(result));
  sql.save_lag(result);
}

// Clean up our lag directory after completion so we don't re-process the same data
function save_complete(err,result) {
  console.log('>> save_complete='+JSON.stringify(result));
  fileUtils.delete_files_from_directory(lagDir);
}

// parse and feed it some data, using Queue to slow down the processing 
// using `afterProcessDelay` so that our sqlite3 database can handle it.
function process_lag_results(lagDir) {
  var q = new Queue((input, cb) => {
    cb(null, input);
  }, { afterProcessDelay: 100 });
  
  lagParser.parse(lagDir, (lag_items) => {
    _.forEach(lag_items, function(lag_item) {
      q.push(lag_item, save_lag_item);
    });  
    q.push('Job complete.', save_complete);
  });
}

process_lag_results(lagDir);
