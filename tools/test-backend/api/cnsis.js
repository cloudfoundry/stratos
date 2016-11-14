(function () {
  'use strict';

  var _ = require('lodash');
  var noCache = require('connect-nocache')();

  exports.init = init;

  var responseTemplate = require('../data/cnsis.json').response;
  var responseTemplateRegistered = require('../data/registered_cnsis.json').response;

  function init(router, config) {

    router.get('/pp/v1/cnsis', noCache, function (request, response) {
      response.json(mockListServiceInstancesResponse(config));
    });

    router.get('/pp/v1/cnsis/registered', noCache, function (request, response) {
      response.json(mockListRegisteredServiceInstancesResponse(config));
    });

  }

  function mockListServiceInstancesResponse(config) {

    var responseArray = [];
    _.each(config.serviceInstances, function (instances, type) {
      for (var i = 0; i < instances; i++) {
        var obj = _.clone(responseTemplate[0]);
        obj.name = 'mock_' + type + '_' + i;
        obj.cnsi_type = type;
        obj.guid = obj.guid + type + i;
        responseArray.push(obj);
      }
    });

    return responseArray;

  }

  function mockListRegisteredServiceInstancesResponse(config) {

    var responseArray = [];
    _.each(config.serviceInstances, function (instances, type) {
      for (var i = 0; i < instances; i++) {
        var obj = _.clone(responseTemplateRegistered[0]);
        obj.name = 'mock_' + type + '_' + i;
        obj.guid = obj.guid + type + i;
        obj.token_expiry = 1575066528;
        obj.cnsi_type = type;
        responseArray.push(obj);

      }
    });

    return responseArray;

  }

})();
