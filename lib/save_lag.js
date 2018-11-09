const log = require('./logger');
const lagParser = require('./parse_lag');
const fileUtils = require('./file_utils');
const contentGenerator = require('./content_generator');
let moment = require('moment');
const settings = require('./settings');
let dataStoreDir = settings['lag.files.dir'];
let _ = require('lodash');

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

// Squash lagItems into a row per topic for each app, summing the lag across partitions
// This can be used for logging/alerting purposes for total lag per topic
function logTotalLagForTopicByApp (lagItems) {
  let byTopic = _.groupBy(lagItems, 'TOPIC');
  let summarizedLagItems = [];
  let consumerName = '';
  let lagTime = 0;
  _.each(Object.keys(byTopic), (topic) => {
    let totalLag = 0;
    let topicLagItems = byTopic[topic];
    _.each(topicLagItems, (item) => {
      if (!consumerName) {
        consumerName = item.consumerName;
      }
      if (!lagTime) {
        lagTime = item.lagTime;
      }
      totalLag = totalLag + Number(item.LAG);
    });
    summarizedLagItems.push({
      TOPIC: topic,
      consumerName: consumerName,
      TOTAL_TOPIC_LAG: totalLag,
      lagTime: lagTime
    });
    log.debug(`consumerName=${consumerName} topic=${topic} totalTopicLag=${totalLag} lagTime=${lagTime}`);
  });
  return summarizedLagItems;
}

// parse and feed it some data
function processLagResults (lagData) {
  lagParser.parse(lagData, (lagItems) => {
    logTotalLagForTopicByApp(lagItems);
    saveToDataStore(lagItems);
  });

  // FIXME just testing. dont fetch, just re-use and re-process the same dataStore
  readFromDataStore(generateAndCleanup);
}

module.exports = { processLagResults, removeOldLagFiles, logTotalLagForTopicByApp };
