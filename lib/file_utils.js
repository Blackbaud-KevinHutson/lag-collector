const log = require('./logger');
let fs = require('fs');
const path = require('path');
const _ = require('lodash');
let fg = require("fast-glob")
const settings = require('./settings');
let dataStoreDir = settings['lag.files.dir'];
let dataStoreRetentionMs = settings['datastore.retention.time.ms'];
let moment = require('moment');

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
        log.error(`read_files GLOB err=${err}`);
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
    log.info(`deleting files from directory=${directory}`);
    fs.readdirSync(directory).forEach(file => {
        fs.unlink(path.join(directory, file), err => {
          if (err) throw err;
        });
      });
}

function list_files_in_datastore(callback) {
  const stream = fg.stream([`${dataStoreDir}/*.json`]);
  const entries = [];
  stream.on('data', (entry) => {
    entries.push(entry);
  });
  stream.once('error', err => {
      log.error(`list_files_in_datastore GLOB err=${err}`);
  });
  stream.once('end', () => {
      callback(entries);
  });
}

function is_data_store_file_expired(fileModifiedTimeMs) {
  let age = moment().diff(fileModifiedTimeMs);
  return age > dataStoreRetentionMs;
}

function delete_expired_data_store_files() {
  log.info(`delete_expired_data_store_files dataStoreDir=${JSON.stringify(dataStoreDir)}`);
  list_files_in_datastore((filePaths) => {
    _.each(filePaths, (filePath) => {
      fs.stat(filePath, (err, fileMetaData) => {
        if(err) {
          log.error(`Enountered an error checking the expiration of a dataStore file. filePath=${filePath} err=${err}`);
        }
        if(is_data_store_file_expired(fileMetaData.mtime)) {
          fs.unlink(filePath, err => {
            if(err) {
              log.error(`Enountered an error deleting an expired dataStore file. filePath=${filePath} err=${err}`);
            }
          });
        }  
      });
    });
  });
}

module.exports = { read_files, write_file, delete_files_from_directory, delete_expired_data_store_files };
