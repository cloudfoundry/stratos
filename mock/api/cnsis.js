'use strict';

var _ = require('lodash');
exports.init = init;

var responseTemplate = require('../data/cnsis.json').response;

function init(router, config) {

  router.get('/pp/v1/cnsis', function (request, response) {
    response.json(mockListServiceInstancesResponse(config));
  });

  router.get('/pp/v1/cnsis/registered', function (request, response) {
    response.json(mockListRegisteredServiceInstancesResponse(config));
  });

}

function mockListServiceInstancesResponse(config) {

  var responseArray = [];
  _.each(config.serviceInstances, function (instances, type) {
    for (var i = 0; i < instances; i++) {
      var obj = responseTemplate[0];
      obj.name = 'mock_' + type + '_' + i;
      obj.cnsi_type = type;
      responseArray.push(obj);
    }
  });

  return responseArray;

}

function mockListRegisteredServiceInstancesResponse(config) {

  var responseArray = [];
  _.each(config.serviceInstances, function (instances, type) {
    for (var i = 0; i < instances; i++) {
      var obj = responseTemplate[0];
      obj.name = 'mock_' + type + '_' + i;
      obj.cnsi_type = type;
      responseArray.push(obj);
    }
  });

  return responseArray;

}
