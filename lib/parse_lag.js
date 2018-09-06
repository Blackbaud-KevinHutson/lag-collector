const { Observable, of } = require('rxjs');
var fs = require('fs');
var readline = require('readline')
var _ = require('lodash');
var headers = [];
var lag_items = [];
var callback = null;
let HEADER_FIELD_TOKEN = 'LOG-END-OFFSET';

// Split our line to get the headers, dropping any empty/falsy items (usually extra spaces)
function extract_header_fields(line) {
    var headers = line.split(' ');
    return _.filter(headers, function(val) {
      return val;
    }); 
}

function get_lag_files(directory) {
    console.log('>>> get_lag_files directory='+directory);
    files = [];
    fs.readdirSync(directory).forEach(file => {
        files.push(directory + "/" + file);
      });
    return files;
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
function parse(filename) {
    var line_reader = readline.createInterface({
        input: fs.createReadStream(filename)
    });
    console.log('parse_lag filename=' + filename);
    let consumer_name = getConsumerNameFromFileName(filename);
    console.log('>> consumer_name=' + consumer_name);

    return Observable.fromEvent(line_reader, 'line')
    .takeUntil(Observable.fromEvent(line_reader, 'close'))
    .map(line => {
        return parse_line(consumer_name, line);
    });               
}


// FIXME ignore lines that we can't process.
// that consumer error line? any others?
function parse_line(consumer_name, line) {
    //console.log('parse_line:', line);
    let tokens = "";
    if(line.includes(HEADER_FIELD_TOKEN)) {
        // Headers are on the first line
        headers = extract_header_fields(line);
        // instead of return false, which might kill our observable, return empty
        return '';
    } else {
        let t = line.split(' ');
        // remove empty items
        tokens = _.without(t,'');
        let tmp = {};
        Object.assign(tmp, {["consumer_name"]: consumer_name});
        _.forEach(tokens, function(val, index){               
            var header = headers[index];
            Object.assign(tmp, {[header]: val});
        });
        return tmp;
    }
}

// Given a file directory, open and parse each line
// into a JS object, returning an array of Observables
// FIXME ideally we'd return one single Observable, but I've had trouble merging them with 
// merge, combineLatest, forkJoin, Subject and other techniques
function parse_lag(lagDir) {
    console.log('parse_lag lagDir=' + lagDir);
    let files = get_lag_files(lagDir);
    let obs = [];
    _.forEach(files, function(fileName) {
        console.log('>> fileName='+fileName);
        obs.push(parse(fileName));
    });
    return obs;
}

module.exports = { parse_lag };