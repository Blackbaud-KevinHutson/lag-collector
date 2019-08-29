const settings = require('./settings');
const logDir = settings['log.files.dir'];
const logLevel = settings['log.level'];
import { createLogger, format, transports } from "winston"
const DailyRotateFile = require('winston-daily-rotate-file');
import fs from "fs";

const env = process.env.NODE_ENV || 'development'; // eslint-disable-line no-process-env

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

function getEnvSensitiveFormatting () {
  
  if (env === 'development') {
    return format.combine(
      format.colorize(),
      format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}`
      )
    );
  } else {
    return format.combine(
      format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}`
      )
    );
  }
}

export const log = createLogger({
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
      level: logLevel,
      format: getEnvSensitiveFormatting()
    }),
      new DailyRotateFile({
          filename: `${logDir}/%DATE%-results.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '5m',
          maxFiles: '10'
      })
  ]
});

log.info(`logLevel configured as ${logLevel}`);
