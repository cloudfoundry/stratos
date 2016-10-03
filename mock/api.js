'use strict';

var express = require('express');
var bodyParser = require('body-parser');

// Mock APIs
var serviceInstances = require('./api/cnsis');
var infoEndpoints = require('./api/info');
var authEndpoints = require('./api/auth');
var appEndpoints = require('./api/apps');
var orgsEndpoints = require('./api/orgs');

exports.init = init;

function init(app, config, proxy) {

  console.log('\x1b[32mMock API Layer registering routes\x1b[0m');

  /* Setup mock request for list instances */
  var mockApiRouter = express.Router();
  mockApiRouter.use(bodyParser.json());


  serviceInstances.init(mockApiRouter, config);
  infoEndpoints.init(mockApiRouter, config);
  authEndpoints.init(mockApiRouter, config, proxy);
  appEndpoints.init(mockApiRouter, config, proxy);
  orgsEndpoints.init(mockApiRouter, config, proxy);

  app.use('/', mockApiRouter);


}
