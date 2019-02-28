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
function readFromDataStore (currentSummarizedLagItems) {
  log.info('readFromDataStore');
  fileUtils.readFiles(dataStoreDir, (dataStore) => {
    generateAndCleanup(currentSummarizedLagItems, dataStore);
  });
}

function generateAndCleanup (currentSummarizedLagItems, dataStore) {
  contentGenerator.generatePages(currentSummarizedLagItems, dataStore);
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
  });
}

// parse and feed it some data
function processLagResults (lagData) {
  lagParser.parse(lagData, (lagItems) => {
    // lagItems here is only the latest, what we want, NOT the whole dataStore!
    saveToDataStore(lagItems);
    const currentSummarizedLagItems = lagSummary.logTotalLagForTopicByApp(lagItems);
    readFromDataStore(currentSummarizedLagItems);
  });
}

module.exports = { processLagResults, removeOldLagFiles };
