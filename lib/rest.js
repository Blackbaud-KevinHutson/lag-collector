var restify = require('restify');

function start() {
  const server = restify.createServer({
    name: 'lag-collector',
    version: '1.0.0'
  });
  
  server.use(restify.plugins.acceptParser(server.acceptable));
  server.use(restify.plugins.queryParser());
  server.use(restify.plugins.bodyParser());
  
  server.get('/echo/:name', function (req, res, next) {
    res.send(req.params);
    return next();
  });
  
  server.listen(8400, function () {
    console.log('%s listening at %s', server.name, server.url);
  }); 
}
module.exports = { start };