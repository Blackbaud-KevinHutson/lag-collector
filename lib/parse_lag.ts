import _ from "lodash";
import moment from "moment";
let headers :any = [];
let HEADER_FIELD_TOKEN = 'LOG-END-OFFSET';
const consumerList = require('./consumers');

// Split our line to get the headers, dropping any empty/falsy items (usually extra spaces)
function extractHeaderFields (line :any) {
  headers = line.split(' ');
  return _.filter(headers, function (val) {
    return val;
  });
}

// Because some consumers may have a slightly different consumer group name from CONSUMER_ID,
// we'll match based on lagItem row's CONSUMER_ID & return actual group name for this consumer
function getConsumerNameFromLagRow (lagItem :any) {
  if (!consumerList) {
    throw new Error('consumerList was not specified in lib/consumers.js.');
  }
  let result = _.filter(consumerList, (consumer :any) => {
    let id = lagItem['CONSUMER-ID'];
    if (id && id.indexOf(consumer.clientIdPrefix) === 0) {
      return true;
    }
  })[0];

  return result ? result.groupName : undefined;
  // FIXME this returns -> "":[],
  // filter that out?
}

function parseLine (line :any, callback :any) {
  let tokens: string[] = [];
  let tmp = {};
  if (line.includes(HEADER_FIELD_TOKEN)) {
    // Headers are on the first line
    headers = extractHeaderFields(line);
  } else {
    let t = line.split(' ');
    // remove empty items
    tokens = _.without(t, '');
    _.forEach(tokens, function (val :any, index :any) {
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

export function parse (lagData :any, callback :any) {
  let lines :any = [];
  _.forEach(lagData.split('\n'), (line :any) => {
    parseLine(line, (lagItem :any) => {
      if (lagItem) {
        lines.push(lagItem);
      }
    });
  });
  callback(lines);
}
