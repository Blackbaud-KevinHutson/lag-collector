const moment = require('moment');
const settings = require('./settings');
let logLevel = settings['log.level'];
let levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
let levelPosition = levels.indexOf(logLevel);

// Provide a consistent log message until we replace with a real logger
function log(level, message) {
    let thisPosition = levels.indexOf(level);
    if(thisPosition >= levelPosition) {
        console.log(`${moment().format()} ${level} ${message}`);
    }
}

log('INFO', `logLevel configured as ${logLevel}`);
module.exports = { log };