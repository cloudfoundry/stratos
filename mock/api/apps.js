'use strict';

var _ = require('lodash');
var uuid = require('node-uuid');
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

function mockAppsResponse(request, config) {

  // How many apps to emulate per cluster
  var minAppCount = config.apps.minCount;
  var maxAppCount = config.apps.maxCount;
  var fixedCount = config.apps.fixedCount;
  var appsPerPage = parseInt(request.query['results-per-page']);
  var currentPage = parseInt(request.query['page']);

  var cnsiList = request.headers['x-cnap-cnsi-list'].split(',');

  var response = {};
  _.each(cnsiList, function (cnsi) {

    if (!_.has(cnsiApps, cnsi)) {
      if (fixedCount !== -1) {
        cnsiApps[cnsi] = fixedCount;
      } else {
        cnsiApps[cnsi] = Math.floor(Math.random() * maxAppCount) + minAppCount;
      }
    }

    var cnsiResponse = _.clone(appsTemplate);
    cnsiResponse.total_pages = Math.ceil(cnsiApps[cnsi] / appsPerPage);
    cnsiResponse.total_results = cnsiApps[cnsi];

    // Calculate how many apps should there be in the current page
    cnsiResponse.resources = generateApps(cnsiApps[cnsi], currentPage, appsPerPage, config);

    if (currentPage < cnsiResponse.total_pages) {
      if (currentPage !== 1) {
        cnsiResponse.prev_url = generatePrevUrl(currentPage, appsPerPage);
      }
      cnsiResponse.next_url = generateNextUrl(currentPage, appsPerPage);
    } else {
      if (currentPage !== 1) {
        cnsiResponse.prev_url = generatePrevUrl(currentPage, appsPerPage);
      }
    }

    if (request.headers['x-cnap-passthrough']) {
      response = cnsiResponse;
    } else {
      response[cnsi] = cnsiResponse;
    }
  });

  return response;
}

function generateApps(totalResults, currentPage, appsPerPage, config) {

  var appCount = 0;
  if (totalResults <= appsPerPage) {
    // HCF is a smaller number of apps than appsPerPage
    appCount = totalResults;
  // } else if ((currentPage * appsPerPage) > totalResults) {
  //   appCount = (currentPage * appsPerPage) - totalResults;

  } else {
    var remainingResults = totalResults - ( (currentPage - 1) * appsPerPage);
    if (remainingResults < appsPerPage) {
      appCount = remainingResults;
    } else {
      appCount = appsPerPage;
    }
  }

  var resources = [];
  for (var i = 0; i < appCount; i++) {

    var app = JSON.parse(JSON.stringify(appsTemplate.resources[0]));
    // var guidVal = uuid.v1();
    var guidVal = randomstring.generate(8);
    app.entity.name = guidVal;
    app.metadata.guid = guidVal;

    // If an hcf.app_id is not provided, set the state to stopped
    if (_.isUndefined(config.hcf.app_id)){
      app.entity.state = 'STOPPED';
    }
    resources.push(JSON.parse(JSON.stringify(app)));
  }
  return resources;
}

function generateNextUrl(pageNumber, appsPerPage) {
  return '/v2/apps?order-direction=asc&page=' + (pageNumber + 1) + '&results-per-page=' + appsPerPage;
}

function generatePrevUrl(pageNumber, appsPerPage) {
  return '/v2/apps?order-direction=asc&page=' + (pageNumber - 1) + '&results-per-page=' + appsPerPage;
}

function rewriteStatsRequest(request, config){
  request.url = request.url.replace(request.params.id, config.hcf.app_id);
  request.headers['x-cnap-cnsi-list'] = config.hcf.cnsi;
  return request;
}
