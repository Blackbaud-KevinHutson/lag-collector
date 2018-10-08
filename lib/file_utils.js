var fs = require('fs');
const path = require('path');

function get_lag_filenames(directory, callback) {
    console.log('>>> get_lag_filenames directory='+directory);
    files = [];
    fs.readdirSync(directory).forEach(file => {
        files.push(directory + "/" + file);
      });
    callback(files);
}

function read_file(filename, callback) {
    fs.readFile(filename, function (err, data) {
        callback(err, data);
    });
}

function delete_files_from_directory(directory) {
    console.log('>>> delete_files_from_directory directory='+directory);
    fs.readdirSync(directory).forEach(file => {
        fs.unlink(path.join(directory, file), err => {
          if (err) throw err;
        });
      });
  }
  
module.exports = { get_lag_filenames, read_file, delete_files_from_directory };