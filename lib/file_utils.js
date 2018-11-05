const log = require('./logger');
let fs = require('fs');
const path = require('path');
const _ = require('lodash');
let fg = require('fast-glob');
const settings = require('./settings');
let dataStoreDir = settings['lag.files.dir'];
let dataStoreRetentionMs = settings['datastore.retention.time.ms'];
let moment = require('moment');

function readFiles (parentDirectory, callback) {
  const stream = fg.stream([`${parentDirectory}/*.json`]);
  const entries = [];
  stream.on('data', (entry) => {
    let lagItems = require(path.resolve(entry));
    _.each(lagItems, (val) => {
      entries.push(val);
    });
  });
  stream.once('error', err => {
    log.error(`readFiles GLOB err=${err}`);
  });
  stream.once('end', () => {
    callback(entries);
  });
}

function writeFile (parentDirectory, fileName, content, callback) {
  if (!fs.existsSync(parentDirectory)) {
    fs.mkdirSync(parentDirectory);
  }
  fs.writeFile(`${parentDirectory}/${fileName}`, content, (err) => {
    callback(err, parentDirectory);
  });
}

function deleteFilesFromDirectory (directory) {
  log.info(`deleting files from directory=${directory}`);
  fs.readdirSync(directory).forEach(file => {
    fs.unlink(path.join(directory, file), err => {
      if (err) {
        throw err;
      }
    });
  });
}

function listFilesInDatastore (callback) {
  const stream = fg.stream([`${dataStoreDir}/*.json`]);
  const entries = [];
  stream.on('data', (entry) => {
    entries.push(entry);
  });
  stream.once('error', err => {
    log.error(`listFilesInDatastore GLOB err=${err}`);
  });
  stream.once('end', () => {
    callback(entries);
  });
}

function isDataStoreFileExpired (fileModifiedTimeMs) {
  let age = moment().diff(fileModifiedTimeMs);
  return age > dataStoreRetentionMs;
}

function deleteExpiredDatastoreFiles () {
  log.info(`deleteExpiredDatastoreFiles dataStoreDir=${JSON.stringify(dataStoreDir)}`);
  listFilesInDatastore((filePaths) => {
    _.each(filePaths, (filePath) => {
      fs.stat(filePath, (err, fileMetaData) => {
        if (err) {
          const errorMessage = `Error checking the expiration of filePath=${filePath} err=${err}`;
          log.error(errorMessage);
        }
        if (isDataStoreFileExpired(fileMetaData.mtime)) {
          fs.unlink(filePath, errInner => {
            if (errInner) {
              log.error(`Error deleting expired file filePath=${filePath} err=${errInner}`);
            }
          });
        }
      });
    });
  });
}

module.exports = { readFiles, writeFile, deleteFilesFromDirectory, deleteExpiredDatastoreFiles };
