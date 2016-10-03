'use strict';

var _ = require('lodash');
var randomstring = require("randomstring");
var noCache = require('connect-nocache')();

exports.init = init;

var appsTemplate = require('../data/apps.json').response;

var cnsiApps = {};

function init(router, config, proxy) {

  router.get('/pp/v1/proxy/v2/apps', noCache, function (request, response) {
    response.json(mockAppsResponse(request, config));
  });

  router.get('/pp/v1/proxy/v2/apps/:id/stats', noCache, function (request, response) {
    return proxy.web(rewriteStatsRequest(request, config), response);
  });

}
