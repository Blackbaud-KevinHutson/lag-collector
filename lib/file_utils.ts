const log = require('./logger');
let fs = require('fs');
const path = require('path');
import _ from "lodash";
let fg = require('fast-glob');
const settings = require('./settings');
let dataStoreDir = settings['lag.files.dir'];
let dataStoreRetentionMs = settings['datastore.retention.time.ms'];
let moment = require('moment');

export function readFiles (parentDirectory :any, callback :any) {
  const stream = fg.stream([`${parentDirectory}/*.json`]);
  const entries :any = [];
  stream.on('data', (entry :any) => {
    let lagItems = require(path.resolve(entry));
    _.each(lagItems, (val) => {
      entries.push(val);
    });
  });
  stream.once('error', (err :any) => {
    log.error(`readFiles GLOB err=${err}`);
  });
  stream.once('end', () => {
    callback(entries);
  });
}

export function writeFile (parentDirectory :any, fileName :any, content :any, callback :any) {
  if (!fs.existsSync(parentDirectory)) {
    fs.mkdirSync(parentDirectory);
  }
  fs.writeFile(`${parentDirectory}/${fileName}`, content, (err :any) => {
    callback(err, parentDirectory);
  });
}

export function deleteFilesFromDirectory (directory :any) {
  log.info(`deleting files from directory=${directory}`);
  fs.readdirSync(directory).forEach((file :any) => {
    fs.unlink(path.join(directory, file), (err :any) => {
      if (err) {
        throw err;
      }
    });
  });
}

function listFilesInDatastore (callback :any) {
  const stream = fg.stream([`${dataStoreDir}/*.json`]);
  const entries :any = [];
  stream.on('data', (entry :any) => {
    entries.push(entry);
  });
  stream.once('error', (err :any) => {
    log.error(`listFilesInDatastore GLOB err=${err}`);
  });
  stream.once('end', () => {
    callback(entries);
  });
}

function isDataStoreFileExpired (fileModifiedTimeMs :any) {
  let age = moment().diff(fileModifiedTimeMs);
  return age > dataStoreRetentionMs;
}

export function deleteExpiredDatastoreFiles () {
  log.info(`deleteExpiredDatastoreFiles dataStoreDir=${JSON.stringify(dataStoreDir)}`);
  listFilesInDatastore((filePaths :any) => {
    _.each(filePaths, (filePath) => {
      fs.stat(filePath, (err :any, fileMetaData :any) => {
        if (err) {
          const errorMessage = `Error checking the expiration of filePath=${filePath} err=${err}`;
          log.error(errorMessage);
        }
        if (isDataStoreFileExpired(fileMetaData.ctime)) {
          fs.unlink((filePath :any, errInner :any) => {
            if (errInner) {
              log.error(`Error deleting expired file filePath=${filePath} err=${errInner}`);
            }
          });
        }
      });
    });
  });
}
