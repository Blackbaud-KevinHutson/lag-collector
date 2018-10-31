// Attempts to use the underlying git repo to display the latest commit in our logs.
const { spawn } = require('child_process');
const log = require('./logger');

function fetchAppVersion(callback) {
    let sha = '';
    const command = spawn('git', ['rev-parse', 'HEAD']);

    command.stdout.on('data', (data) => {
      log.info(`fetchAppVersion: Last commit hash on this branch is: ${data}`);
      sha += data;
      });
      
    command.stderr.on('data', (data) => {
      let message = `fetchAppVersion: Unable to retrieve version. This is not an error if you deployed without git. command=${commandName} data=${data}`;
      log.warn(message);
    });
    
    command.on('close', (code) => {
      log.info(`fetchAppVersion: Child process exited with code=${code}`);
      callback(sha);
    });  
}
module.exports = { fetchAppVersion }
