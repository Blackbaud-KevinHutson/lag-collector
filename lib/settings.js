module.exports = {
  // location of lag data store files
  'lag.files.dir': 'public/data',
  // location of log files
  'log.files.dir': 'log',
  // time display - time displayed: date string(0) or unit time in millis(1)
  'chart.time.type': 0,
  // what time to display generate lag pages (example: -05:00)
  'time.zone.name': 'America/Chicago',
  // how often to run save_lag.js (milliseconds)
  'save.lag.execution.interval': 3600000,
  // Configure log level (debug, verbose, info, warn erro).
  // See https://github.com/winstonjs/winston#logging-levels
  'log.level': 'debug',
  // How long to keep lag data in dataStore in millieseconds
  'datastore.retention.time.ms': 2600000000
};
