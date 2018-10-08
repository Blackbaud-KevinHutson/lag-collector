var fs = require('fs');
var _ = require('lodash');
var headers = [];
let HEADER_FIELD_TOKEN = 'LOG-END-OFFSET';

// Split our line to get the headers, dropping any empty/falsy items (usually extra spaces)
function extract_header_fields(line) {
    var headers = line.split(' ');
    return _.filter(headers, function(val) {
      return val;
    }); 
}

function get_lag_filenames(directory, callback) {
    console.log('>>> get_lag_files directory='+directory);
    files = [];
    fs.readdirSync(directory).forEach(file => {
        files.push(directory + "/" + file);
      });
    callback(files);
}

// In order to easily resolve the consumer's name, we are using the filename as an identifier
// Otherwise, you could use CLIENT_ID from the consumer lag report.
// However, in our case, we attach a UUID and instance to every consumer making it very difficult to parse out the base consumer name.
// Example: Expected input: "some_directory/consumerName~sometimestamp.txt"
// Returns consumerName
function getConsumerNameFromFileName(file_path) {
    let directory_and_file = file_path.split('~')[0];
    // grab the second element, the filename to get the consumer's name
    return directory_and_file.split('/')[1];
}

// Parses a file. filename is assumed to contain the Consumer's name.
function parse_file(filename, callback) {
    let consumer_name = getConsumerNameFromFileName(filename);
    console.log('>> consumer_name=' + consumer_name);
    fs.readFile(filename, function (err, data) {
        let lines = [];
        bufferString = data.toString(); 
        bufferStringSplit = bufferString.split('\n'); 
        _.forEach(bufferStringSplit, function(line, index){               
            parse_line(consumer_name, line, (lag_item) => {
                lines.push(lag_item);
            });
        });
        callback(lines);
      });
}

function parse_line(consumer_name, line, callback) {
    let tokens = "";
    let tmp = {};
    if(line.includes(HEADER_FIELD_TOKEN)) {
        // Headers are on the first line
        headers = extract_header_fields(line);
    } else {
        let t = line.split(' ');
        // remove empty items
        tokens = _.without(t,'');
        Object.assign(tmp, {["consumer_name"]: consumer_name});
        _.forEach(tokens, function(val, index){               
            var header = headers[index];
            Object.assign(tmp, {[header]: val});
        });
        callback(tmp);
    }
}

// Given a file directory, open and parse each line
// into a JS object, returning an array of lines
function parse_files(files, callback) {
    _.forEach(files, function(fileName) {
        let lag_items = [];
        console.log('\n\n>> fileName='+fileName);
        parse_file(fileName, (lines) => {
            callback(lines);
        });
    });
}

function parse(lagDir, callback) {
    get_lag_filenames(lagDir, (file_names) => {
        console.log('\nparse_lag lagDir=' + lagDir);
        parse_files(file_names, (lag_items) => {
            callback(lag_items);
        })
    });
}

module.exports = { parse };