const expressServer = require('./lib/express');

function start() {
  expressServer.start();
  console.log('started.');
}

start();
