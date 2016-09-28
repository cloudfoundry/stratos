'use strict';

var express = require('express');
var bodyParser = require('body-parser');

// Mock APIs
var serviceInstances = require('./api/cnsis');

exports.init = init;

function init(app, config) {

  console.log('\x1b[32mMock API Layer registering routes\x1b[0m');

  /* Setup mock request for list instances */
  var mockApiRouter = express.Router();
  mockApiRouter.use(bodyParser.json());

  //
  serviceInstances.init(mockApiRouter, config);

  app.use('/', mockApiRouter);


}
