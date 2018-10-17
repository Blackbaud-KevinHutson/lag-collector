const log = require('./logger');
const lagParser = require('./parse_lag');
const PropertiesReader = require('properties-reader');
const _ = require('lodash');
const fileUtils = require('./file_utils');
const contentGenerator = require('./content_generator');
let path = require('path');
let moment = require('moment');
let properties = PropertiesReader(path.dirname(module.parent.filename) + '/settings.properties');
let dataStoreDir = properties.get('main.lag.files.dir');

// FIXME need a function that deletes old files past a data. 
function remove_old_lag_files() {
  // just read the suffix which has the time or use node.js file modified property?
  //fileUtils.delete_files_from_directory(dataStoreDir);
  // FIXME use a callback or Observable b/c it needs to wait for readFile to finish!
  log.log('INFO',`remove_old_lag_files dataStoreDir=${JSON.stringify(dataStoreDir)}`);
}

// The dataStore is simply a directory containing parsed lag files in JSON format
function readFromDataStore(dataStoreDir, callback) {
  log.log('INFO','readFromDataStore');
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
  log.log('INFO',`Saving file to dataStore, dataStoreDir=${dataStoreDir} dataStoreFile=${dataStoreFile}`);
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

module.exports = { process_lag_results };  
