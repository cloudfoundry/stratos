'use strict';

var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var path = require('path');

var config;

try {
  // Need a JSON file named 'mock.config.json'
  var configFileName = path.resolve(__dirname, '../mock/config/mock.config.json')
  console.log(configFileName);
  config = require(configFileName);
} catch (e) {
  throw 'Can not find the required mock.config.json configuration file';
}

var port = config.port || 4000;

// Delay to simulate slower proxy API calls 
var delay = config.port || 0;

var staticFiles = path.join(__dirname, '..', 'dist');
app.use(express.static(staticFiles));

var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({
  target: {
    host: config.portal_proxy.host,
    port: config.portal_proxy.port || 80
  }
});

var mockApi = require('../mock/api');
mockApi.init(app, config);

if (delay > 0) {
  app.use(function (req, res, next) {
    // Only delay those calls that are proxied calls to HCF or HCE endpoints
    // TODO - this currently slows all calls down
    setTimeout(next, delay);
  });
}

app.use(function (req, res, next) {
  if (req.url.indexOf('/pp') === 0) {
    console.log(req.method + ' ' + req.url);
    return proxy.web(req, res);
  } else {
    return next();
  }
});

server.on('upgrade', function (req, socket, head) {
  proxy.ws(req, socket, head);
});


server.listen(port, function () {
    console.log('\x1b[32mStackato Console Test HTTP Server starts listening on %d ...\x1b[0m', port);
});
