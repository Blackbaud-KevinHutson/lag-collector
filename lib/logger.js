const settings = require('./settings');
const logDir = settings['log.files.dir'];
const logLevel = settings['log.level'];
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const env = process.env.NODE_ENV || 'development'; // eslint-disable-line no-process-env

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: `${logDir}/%DATE%-results.log`,
  datePattern: 'YYYY-MM-DD'
});

function getEnvSensitiveFormatting() {
  const lineFormat = `${info.timestamp} ${info.level}: ${info.message}`
  if(env === 'development') {
    return format.combine(
      format.colorize(),
      format.printf(
        info => lineFormat
      )
    )
  } else {
    return format.combine(
      format.printf(
        info => lineFormat
      )
    )
  }
}

const log = createLogger({
  // change level if in dev environment versus production
  level: env === 'development' ? 'verbose' : logLevel,
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console({
      level: 'info',
      format: getEnvSensitiveFormatting()
    }),
    dailyRotateFileTransport
  ]
});

log.info(`logLevel configured as ${logLevel}`);
module.exports = log;
