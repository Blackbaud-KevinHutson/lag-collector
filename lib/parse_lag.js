let _ = require('lodash');
let headers = [];
let HEADER_FIELD_TOKEN = 'LOG-END-OFFSET';
let moment = require('moment');
const consumerList = require('./consumers');

// Split our line to get the headers, dropping any empty/falsy items (usually extra spaces)
function extractHeaderFields (line) {
  headers = line.split(' ');
  return _.filter(headers, function (val) {
    return val;
  });
}

// Because some consumers may have a slightly different consumer group name from CONSUMER_ID,
// we'll match based on lagItem row's CONSUMER_ID & return actual group name for this consumer
function getConsumerNameFromLagRow (lagItem) {
  if (!consumerList) {
    throw new Error('consumerList was not specified in lib/consumers.js.');
  }
  let result = _.filter(consumerList, (consumer) => {
    let id = lagItem['CONSUMER-ID'];
    if (id && id.indexOf(consumer.clientIdPrefix) === 0) {
      return true;
    }
  })[0];

  return result ? result.groupName : undefined;
  // FIXME this returns -> "":[],
  // filter that out?
}

function parseLine (line, callback) {
  let tokens = '';
  let tmp = {};
  if (line.includes(HEADER_FIELD_TOKEN)) {
    // Headers are on the first line
    headers = extractHeaderFields(line);
  } else {
    let t = line.split(' ');
    // remove empty items
    tokens = _.without(t, '');
    _.forEach(tokens, function (val, index) {
      let header = headers[index];
      Object.assign(tmp, {[header]: val});
    });
    if (tokens && tokens.length > 0) {
      // Assign the date so we know when this was captured
      let now = moment().utc().valueOf();
      Object.assign(tmp, {lagTime: now});
      let consumerName = getConsumerNameFromLagRow(tmp);
      Object.assign(tmp, {consumerName: consumerName});
      callback(tmp);
    } else {
      callback(undefined);
    }
  }
}

function parse (lagData, callback) {
  let lines = [];
  _.forEach(lagData.split('\n'), (line) => {
    parseLine(line, (lagItem) => {
      if (lagItem) {
        lines.push(lagItem);
      }
    });
  });
  callback(lines);
}

module.exports = { parse };
