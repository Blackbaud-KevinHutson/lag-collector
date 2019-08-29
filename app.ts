const log = require('./lib/logger');
const expressServer = require('./lib/express');
const getLag = require('./lib/get_lag');
const saveLag = require('./lib/save_lag');
const fetchVersion = require('./lib/fetch_version');

function saveDateAndScheduleJob (lagData: any) {
  saveLag.processLagResults(lagData);
}

function startLagRetrieval () {
  log.info('startLagRetrieval');
  getLag.start(saveDateAndScheduleJob);
}

function start () {
  expressServer.start();
  startLagRetrieval();
  fetchVersion.fetchAppVersion(() => {});
  log.info('started.');
}

start();
