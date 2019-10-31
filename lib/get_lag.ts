// Spawns a separate process to execute get_lag.sh and gather lag results
// A callback returns the results
import { log } from "./logger";
import { spawn } from "child_process";
let path = require('path');
const consumerList = require('./consumers');

export function start (callback :any) {
  if (!consumerList) {
    throw new Error('consumerList was not specified in lib/consumers.js.');
  }

  // Note you can substitute the usual script with get_lag_mock.sh to simulate data
  // without actually invoking the real consumer lag retrieval command
  if(!module.parent) {
    throw 'Unable to find module name.';
  }
  const commandName = path.dirname(module.parent.filename) + '/get_lag.sh';
  let args = consumerList.map((consumer :any) => consumer.groupName);
  log.info(`start executing commandName=${commandName} ${args}`);
  
  const command = spawn(commandName, args);
  let lagData = '';

  command.stdout.on('data', (data :any) => {
    lagData = lagData + data;
  });

  command.stderr.on('data', (data :any) => {
    let message = `An error occurred executing command=${commandName}  data=${data}`;
    log.error(message);
  });

  command.on('close', (code :any) => {
    log.info(`Child process exited with code=${code}`);
    callback(lagData);
  });
}
