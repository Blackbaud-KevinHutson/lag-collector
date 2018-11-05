// Spawns a seperate process to execute get_lag.sh and gather lag results
// A callback returns the results
const log = require('./logger');
const { spawn } = require('child_process');
let path = require('path');
const consumerList = require('./consumers');

function start (callback) {
  if (!consumerList) {
    throw new Error('consumerList was not specified in lib/consumers.js.');
  }

  // Note you can substitute the usual script with get_lag_mock.sh to simulate data
  // without actually invoking the real consumer lag retrieval command
  const commandName = path.dirname(module.parent.filename) + '/get_lag_mock.sh';
  let args = consumerList.map(consumer => consumer.groupName);
  log.info(`start executing commandName=${commandName} ${args}`);
  const command = spawn(commandName, args);
  let lagData = '';

  command.stdout.on('data', (data) => {
    lagData = lagData + data;
  });

  command.stderr.on('data', (data) => {
    let message = `An error occurred executing command=${commandName}  data=${data}`;
    log.error(message);
  });

  command.on('close', (code) => {
    log.info(`Child process exited with code=${code}`);
    callback(lagData);
  });
}

module.exports = { start };
