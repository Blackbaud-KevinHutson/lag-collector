// Attempts to use the underlying git repo to display the latest commit in our logs.
const { spawn } = require('child_process');
const log = require('./logger');

export function fetchAppVersion (callback :any) {
  let sha = '';
  const command = spawn('git', ['rev-parse', 'HEAD']);

  command.stdout.on('data', (data :any) => {
    log.info(`fetchAppVersion: Last commit hash on this branch is: ${data}`);
    sha = sha + data;
  });

  command.stderr.on('data', (data :any) => {
    let message = `fetchAppVersion: Unable to retrieve git version.
    This is not an error if you deployed without git. data=${data}`;
    log.warn(message);
  });

  command.on('close', (code :any) => {
    log.info(`fetchAppVersion: Child process exited with code=${code}`);
    callback(sha);
  });
}

