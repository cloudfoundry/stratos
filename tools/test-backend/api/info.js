/* eslint-disable no-warning-comments,angular/json-functions */
(function () {
  'use strict';

  var _ = require('lodash');
  var noCache = require('connect-nocache')();
  exports.init = init;

  var responseTemplate = require('../data/stackatoInfo.json').response;
  var hcfInfoTemplate = require('../data/hcfInfo.json').response;
  var hceInfoTemplate = require('../data/hceInfo.json').response;

  function init(router, config) {

    router.get('/pp/v1/stackato/info', noCache, function (request, response) {
      response.json(mockStackatoInfo(config));
    });

    router.get('/pp/v1/proxy/v2/info', noCache, function (request, response) {
      response.json(mockHcfProxyInfo(request));
    });

    router.get('/pp/v1/proxy/info', function (request, response) {
      request.header('Cache-Control', noCache, 'private, no-cache, no-store, must-revalidate');
      response.json(mockHceProxyInfo(request));
    });

  }

  function mockStackatoInfo(config) {

    var response = JSON.parse(JSON.stringify(responseTemplate));

    _.each(config.serviceInstances, function (instances, type) {

      var endpoints = {};

      for (var i = 0; i < instances; i++) {
        var guid = Object.keys(responseTemplate.endpoints[type])[0];
        var endpoint = JSON.parse(JSON.stringify(response.endpoints[type][guid]));
        endpoint.name = 'mock_' + type + '_' + i;
        endpoint.guid = endpoint.guid + type + i;
        endpoints[endpoint.guid] = endpoint;
      }
      response.endpoints[type] = endpoints;
    });

    return response;
  }

  function mockHcfProxyInfo(request) {

    // TODO how many are disconnected
    var cnsiList = request.headers['x-cnap-cnsi-list'].split(',');

    var guid = Object.keys(hcfInfoTemplate)[0];
    var endpoint = _.clone(hcfInfoTemplate[guid]);

    var responseObj = {};
    _.each(cnsiList, function (cnsi) {
      responseObj[cnsi] = _.clone(endpoint);
    });

    return responseObj;
  }

  function mockHceProxyInfo(request) {

    // TODO how many are disconnected
    var cnsiList = request.headers['x-cnap-cnsi-list'].split(',');

    var guid = Object.keys(hceInfoTemplate)[0];
    var endpoint = _.clone(hceInfoTemplate[guid]);

    var responseObj = {};
    _.each(cnsiList, function (cnsi) {
      responseObj[cnsi] = _.clone(endpoint);
    });

    return responseObj;
  }

})();
