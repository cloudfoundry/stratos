/* eslint-disable no-console */
/* eslint-disable no-process-env */
/* eslint-disable angular/log */
/* eslint-disable angular/json-functions */
(function () {
  'use strict';

  var _ = require('lodash');
  var request = require('request');
  var os = require('os');
  var express = require('express');
  var http = require('http');
  var apiApp = express();
  var apiRouter = express.Router();

  var myIp = 'localhost';
  var ifaces = os.networkInterfaces();
  _.forEach(ifaces, function (iface, ifname) {
    _.forEach(iface, function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false || _.startsWith(iface.address, '192')) {
        // skip over internal (i.e. 127.0.0.1), non-ipv4 addresses or docker internal bridges
        return;
      }
      console.log('IP detected: ' + ifname + ' \x1b[32m' + iface.address + '\x1b[0m');
      myIp = iface.address;
    });

  });

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  var v2Info;
  var vagrantHost = 'cf-dev.io';
  var httpsRegex = new RegExp('(https://.*)' + vagrantHost);
  var nonHttpsRegex = new RegExp(vagrantHost);
  var httpsPublicHost = myIp + '.nip.io:8443';
  var nonHttpsPublicHost = myIp + '.nip.io';

  request('https://api.' + vagrantHost + '/v2/info', function (error, response, body) {

    if (error) {
      console.log('There was an error reading v2/info: ', error);
      return;
    }

    if (response && response.statusCode !== 200) {
      console.log('Not ok status-code: ' + response.statusCode + ': ', body);
      return;
    }

    v2Info = JSON.parse(body);
    _.forEach(v2Info, function (val, key) {
      if (_.isString(val)) {
        v2Info[key] = v2Info[key].replace(httpsRegex, '$1' + httpsPublicHost);
        v2Info[key] = v2Info[key].replace(nonHttpsRegex, nonHttpsPublicHost);
      }
    });

    console.log('Will serve the following canned v2/info:');
    console.log(JSON.stringify(v2Info, null, 4));
    startServer();
  });

  function startServer() {

    apiRouter.get('/v2/info', function (request, response) {
      response.json(v2Info);
    });

    // Log requests
    apiApp.use(function (req, res, next) {
      try {
        console.log('Received request: ' + req.ip + ' ' + req.method + ' ' + req.path);
      } catch (error) {
        console.error('Failed to log request.', error);
      }
      next();
    });

    apiApp.use(apiRouter);

    var server = http.createServer(apiApp);
    var port = 3210;
    server.listen(port, function () {
      console.log('\x1b[32mHTTP Server starts listening on port: %d ...\x1b[0m', port);
    });
  }

})();
