import express from "express";
let path = require('path');

export function start () {
  let app = express();
  app.use(express.static('public'));
  app.get('/', (req: Request, res: any) => {
    if(!module.parent) {
        throw 'Unable to find module name.';
    }
    res.sendFile(path.dirname(module.parent.filename) + '/public/index.htm');
  });
  app.listen(3000);
}
