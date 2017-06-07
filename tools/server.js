/* eslint-disable angular/log,no-console,no-process-env,no-sync */
(function () {
  'use strict';

  // New way of setting up express server
  var express = require('express');
  var https = require('https');
  var app = express();
  var fs = require('fs');
  var path = require('path');
  var httpProxy = require('http-proxy');
  var devConfig = require('./dev_config.json');

  // Import browwser sync utils so we can use their default certs
  var browserSyncCertsFolder = path.resolve('./node_modules/browser-sync/lib/server/certs');

  var opts = {
    key: fs.readFileSync(path.join(browserSyncCertsFolder, 'server.key'), 'utf8'),
    cert: fs.readFileSync(path.join(browserSyncCertsFolder, 'server.crt'), 'utf8'),
    ca: fs.readFileSync(path.join(browserSyncCertsFolder, 'server.csr'), 'utf8'),
    passphrase: ''
  };

  var port = process.env.client_port || 3100;
  var appFolder = process.env.client_folder || path.resolve('../dist');
  var doNotLogRequests = process.env.client_logging === 'true';

  // config is of the form: "pp": "https://nwm-dev-3.gbr.hp.com/pp"
  var target = devConfig.pp;
  if (target.endsWith('/pp')) {
    target = target.substr(0, target.length - 3);
  }

  app.use(express.static(appFolder));

  var proxy = httpProxy.createServer({
    target: target,
    ssl: opts,
    secure: false
  });

  app.use(function (req, res, next) {
    if (!doNotLogRequests) {
      console.log('\x1b[36m%s %s\x1b[0m', req.method, req.url);
    }
    try {
      return proxy.web(req, res);
    } catch (e) {
      console.log('\x1b[31mError proxying request: %s\x1b[0m', req.url);
      return next();
    }
  });

  var server = https.createServer(opts, app);

  server.on('upgrade', function (req, socket, head) {
    proxy.ws(req, socket, head);
  });

  server.listen(port, function () {
    console.log('\x1b[32mConsole HTTPS Server started listening on port %d\x1b[0m', port);
    console.log('\x1b[32mServing application from %s\x1b[0m', appFolder);
    console.log('\x1b[32mProxying Console Back-end API requets to %s\x1b[0m', target);
  });

})();
