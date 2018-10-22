const log = require('./logger');
let fs = require('fs');
const path = require('path');
const _ = require('lodash');
let fg = require("fast-glob")

function read_files(parentDirectory, callback) {
    const stream = fg.stream([`${parentDirectory}/*.json`]);
    const entries = [];
    stream.on('data', (entry) => {
        let lagItems = require( path.resolve( entry ) );
        _.each(lagItems, (val) => {
            entries.push(val);
        });
    });
    stream.once('error', err => {
        log.log('ERROR',`read_files GLOB err=${err}`);
    });
    stream.once('end', () => {
        callback(entries);
    });
}

function write_file(parentDirectory, fileName, content, callback) {
    if (!fs.existsSync(parentDirectory)){
      fs.mkdirSync(parentDirectory);
    }
    fs.writeFile(`${parentDirectory}/${fileName}`, content, (err) => {
        callback(err, parentDirectory);
    });
} 

function delete_files_from_directory(directory) {
    log.log('INFO',`deleting files from directory=${directory}`);
    fs.readdirSync(directory).forEach(file => {
        fs.unlink(path.join(directory, file), err => {
          if (err) throw err;
        });
      });
  }
  
module.exports = { read_files, write_file, delete_files_from_directory };
