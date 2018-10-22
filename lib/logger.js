const moment = require('moment');
const PropertiesReader = require('properties-reader');
let properties = PropertiesReader('settings.properties');
let logLevel = properties.get('main.log.level');

let levels = ['DEBUG', 'INFO', 'ERROR'];
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