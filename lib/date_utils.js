let moment = require('moment-timezone');
const settings = require('./settings');
let timeZoneName = settings['time.zone.name'];

function formattedTime (value) {
  let time = value ? moment(value) : moment();
  return time.tz(timeZoneName || 'America/Chicago').format();
}

module.exports = { formattedTime };
