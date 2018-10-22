let _ = require('lodash');
let headers = [];
let HEADER_FIELD_TOKEN = 'LOG-END-OFFSET';
let moment = require('moment');
const consumerList = require('./consumers');
const log = require('./logger');

// Split our line to get the headers, dropping any empty/falsy items (usually extra spaces)
function extract_header_fields(line) {
    var headers = line.split(' ');
    return _.filter(headers, function(val) {
      return val;
    }); 
}

// Because some consumers may have a slightly different consumer group name from CONSUMER_ID, we'll do some 
//  matching based on the lagItem row's CONSUMER_ID and return the actual group name for this consumer
function getConsumerNameFromLagRow(lagItem) {
    if(!consumerList) {
        throw 'consumerList was not specified in lib/consumers.js.';
      }    
    let result = _.filter(consumerList, (consumer) => {
        //let consumerIdPrefix = consumer.consumer_id_prefix;
        let id = lagItem['CONSUMER-ID'];
        if(id && id.indexOf(consumer.client_id_prefix) == 0) {
            return true;
        };
    })[0];

    return result ? result.group_name : undefined;
    // FIXME this returns -> "":[],
    // filter that out?
}

function parse_line(line, callback) {
    let tokens = "";
    let tmp = {};
    if(line.includes(HEADER_FIELD_TOKEN)) {
        // Headers are on the first line
        headers = extract_header_fields(line);
    } else {
        let t = line.split(' ');
        // remove empty items
        tokens = _.without(t,'');
        _.forEach(tokens, function(val, index){     
            var header = headers[index];
            Object.assign(tmp, {[header]: val});
        });
        if(tokens && tokens.length > 0) {
            // Assign the date so we know when this was captured
            var now = moment().utc().valueOf();
            Object.assign(tmp, {"lag_time": now});
            let consumer_name = getConsumerNameFromLagRow(tmp);
            Object.assign(tmp, {"consumer_name": consumer_name});
            callback(tmp);
        } else {
            callback(undefined);
        }
    }
}

function parse(lagData, callback) {
    let lines = [];
    _.forEach(lagData.split('\n'), (line) => {
        parse_line(line, (lag_item) => {
            if(lag_item) {
                lines.push(lag_item);
            }
        });
    });
    callback(lines);
}

module.exports = { parse };