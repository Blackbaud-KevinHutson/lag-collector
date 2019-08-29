let moment = require('moment-timezone');
const settings = require('./settings');
let timeZoneName = settings['time.zone.name'];

export function formattedTime (value :any) {
  let time = value ? moment(value) : moment();
  return time.tz(timeZoneName || 'America/Chicago').format();
}
