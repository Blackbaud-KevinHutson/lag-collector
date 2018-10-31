const log = require('./logger');
const lagParser = require('./parse_lag');
const _ = require('lodash');
const fileUtils = require('./file_utils');
const contentGenerator = require('./content_generator');
let moment = require('moment');
const settings = require('./settings');
let dataStoreDir = settings['lag.files.dir'];

function remove_old_lag_files() {
  fileUtils.delete_expired_data_store_files();
}

// The dataStore is simply a directory containing parsed lag files in JSON format
function readFromDataStore(dataStoreDir, callback) {
  log.info('readFromDataStore');
  fileUtils.read_files(dataStoreDir, (result) => {
    callback(result);
  });
}

function generateAndCleanup(dataStore, callback) {
  contentGenerator.generatePages(dataStore);
  remove_old_lag_files();
}

function saveToDataStore(lagItems) {
  let now = moment().utc().valueOf();
  let dataStoreFile = `lag-data-${now}.json`;
  log.info(`Saving file to dataStore, dataStoreDir=${dataStoreDir} dataStoreFile=${dataStoreFile}`);
  fileUtils.write_file(dataStoreDir, dataStoreFile, JSON.stringify(lagItems), (err) => {
    if (err) throw err;
    readFromDataStore(dataStoreDir, generateAndCleanup);
  });
}

// parse and feed it some data
function process_lag_results(lagData) {
  lagParser.parse(lagData, (lagItems) => {
    saveToDataStore(lagItems);
  });

  // FIXME just testing. dont fetch, just re-use and re-process the same dataStore
  readFromDataStore(dataStoreDir, generateAndCleanup);
}

module.exports = { process_lag_results, remove_old_lag_files };  
