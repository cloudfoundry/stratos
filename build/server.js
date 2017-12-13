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

  // config is of the form: "pp": "https://[server]/pp"
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

  // Handle errors - otherwise teh proxy library will just abort
  proxy.on('error', function (err) {
    console.log('\x1b[31mError proxying request: %s\x1b[0m', err.code);
  });

  app.use(function (req, res) {
    // Only proxy requests that start /pp
    if (req.url.indexOf('/pp/') !== 0) {
      console.log('\x1b[31m%s %s\x1b[0m', req.method, req.url);
      res.status(404).send('Not found');
    } else {
      if (!doNotLogRequests) {
        console.log('\x1b[36m%s %s\x1b[0m', req.method, req.url);
      }

      // Remove the /pp
      req.url = req.url.substr(3);
      console.log(req.url);
      return proxy.web(req, res);
    }
  });

  var server = https.createServer(opts, app);

  server.on('upgrade', function (req, socket, head) {
    req.url = req.url.substr(3);
    console.log('\x1b[31m%s %s\x1b[0m', req.method, req.url);
    proxy.ws(req, socket, head);
  });

  server.listen(port, function () {
    console.log('\x1b[32mConsole HTTPS Server started listening on port %d\x1b[0m', port);
    console.log('\x1b[32mServing application from %s\x1b[0m', appFolder);
    console.log('\x1b[32mProxying Console Back-end API requests to %s\x1b[0m', target);
  });

})();
