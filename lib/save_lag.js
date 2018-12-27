const log = require('./logger');
const lagParser = require('./parse_lag');
const fileUtils = require('./file_utils');
const contentGenerator = require('./content_generator');
let moment = require('moment');
const settings = require('./settings');
let dataStoreDir = settings['lag.files.dir'];
const lagSummary = require('./lag_summary');

function removeOldLagFiles () {
  fileUtils.deleteExpiredDatastoreFiles();
}

// The dataStore is simply a directory containing parsed lag files in JSON format
function readFromDataStore (callback) {
  log.info('readFromDataStore');
  fileUtils.readFiles(dataStoreDir, (result) => {
    callback(result);
  });
}

function generateAndCleanup (dataStore) {
  contentGenerator.generatePages(dataStore);
  removeOldLagFiles();
}

function saveToDataStore (lagItems) {
  let now = moment().utc().valueOf();
  let dataStoreFile = `lag-data-${now}.json`;
  log.info(`Saving file to dataStore, dataStoreDir=${dataStoreDir} dataStoreFile=${dataStoreFile}`);
  fileUtils.writeFile(dataStoreDir, dataStoreFile, JSON.stringify(lagItems), (err) => {
    if (err) {
      throw err;
    }
    readFromDataStore(generateAndCleanup);
  });
}

// parse and feed it some data
function processLagResults (lagData) {
  lagParser.parse(lagData, (lagItems) => {
    lagSummary.logTotalLagForTopicByApp(lagItems);
    saveToDataStore(lagItems);
  });

  // FIXME just testing. dont fetch, just re-use and re-process the same dataStore
  readFromDataStore(generateAndCleanup);
}

module.exports = { processLagResults, removeOldLagFiles };
