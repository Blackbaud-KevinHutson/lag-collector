var fs = require('fs');
var readline = require('readline')
var _ = require('lodash');
var headers = [];
var lag_items = [];
var first_line = true;
var callback = null;

// Split our line to get the headers, dropping any empty/falsy items (usually extra spaces)
function extract_header_fields(line) {
    var headers = line.split(' ');
    return _.filter(headers, function(val) {
      return val;
    }); 
}

function parse_line(line) {
    let tokens = "";
    if(first_line) {
        // Headers are on the first line
        headers = extract_header_fields(line);
        first_line = false;
    } else {
        let t = line.split(' ');
        // remove empty items
        tokens = _.without(t,'');
        let tmp = {};
        _.forEach(tokens, function(val, index){               
            var header = headers[index];
            Object.assign(tmp, {[header]: val});
            lag_items.push(tmp);
        });
    }
}

function parse_result() {
    console.log('headers:', headers);
    callback(lag_items);
}

function parse_lag(c) {
    console.log('..parsing');
    callback = c;

    var line_reader = readline.createInterface({
        input: fs.createReadStream('group-lag-output.txt')
    });
    line_reader.on('line', parse_line);
    line_reader.on('close', parse_result);
}
module.exports = { parse_lag };