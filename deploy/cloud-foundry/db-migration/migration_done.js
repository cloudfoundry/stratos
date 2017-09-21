(function () {
  'use strict';

  var http = require('http');

  var args = process.argv.slice(2);
  var port = parseInt(args[0]);

  http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('DB Migration complete\n');
  }).listen(port, "0.0.0.0");

})();
