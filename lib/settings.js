module.exports = {
  // location of lag data store files
  'lag.files.dir': 'public/data',
  // time display - time displayed: date string(0) or unit time in millis(1)
  'chart.time.type': 1,
  // what time to display generate lag pages (example: -05:00)
  'pages.time.utcoffset': '-05:00',
  // how often to run save_lag.js (milliseconds)
  'save.lag.execution.interval': 3600000,
  // Configure log level (DEBUG, INFO, WARN, ERROR)
  'log.level': 'DEBUG',
};

