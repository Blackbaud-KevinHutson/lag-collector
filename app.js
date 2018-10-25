const log = require('./lib/logger');
const expressServer = require('./lib/express');
const getLag = require('./lib/get_lag');
const saveLag = require('./lib/save_lag');
const fetchVersion = require('./lib/fetch_version');

function startLagRetrieval() {
  log.log('INFO','startLagRetrieval');
  getLag.start(saveDateAndScheduleJob);
}

function saveDateAndScheduleJob(lagData) {
 saveLag.process_lag_results(lagData);
}

function start() {
  expressServer.start();  
  startLagRetrieval();  
  fetchVersion.fetchAppVersion(() => {});
  log.log('INFO','started.');
}

start();
