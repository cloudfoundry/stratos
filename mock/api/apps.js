'use strict';

var _ = require('lodash');
var uuid = require('node-uuid');
var randomstring = require("randomstring");
var noCache = require('connect-nocache')();
var utils = require('./utils');

exports.init = init;

var appsTemplate = require('../data/apps.json').response;

var cnsiApps = {};

function init(router, config, proxy) {

  var delay = config.apps.apiDelay || 0;

  router.get('/pp/v1/proxy/v2/apps', noCache, function (request, response) {
    setTimeout(function () {
      if (_.isUndefined(request.query.q)) {
        response.json(mockAppsResponse(request, config));
      } else {
        response.json(mockAppsResponseWithQ(request, config));

      }
    }, delay);
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
  var exactCounts = config.apps.exactCounts;
  var appsPerPage = parseInt(request.query['results-per-page']);
  var currentPage = parseInt(request.query['page']);

  // check if organizationGuid has been supplied

  var cnsiList = utils.getCnsiList(request);

  var response = {};
  _.each(cnsiList, function (cnsi, index) {


    if (!_.has(cnsiApps, cnsi)) {
      cnsiApps[cnsi] = {};
      if (fixedCount !== -1) {
        cnsiApps[cnsi].appCount = fixedCount;
      } else {
        if (exactCounts && exactCounts[index]) {
          cnsiApps[cnsi].appCount = exactCounts[index];
        } else {
          cnsiApps[cnsi].appCount = Math.floor(Math.random() * maxAppCount) + minAppCount;
        }
      }
    }

    cnsiApps[cnsi] = determineAppsPerOrg(cnsiApps[cnsi], index, config);

    var cnsiResponse = _.clone(appsTemplate);
    cnsiResponse.total_pages = Math.ceil(cnsiApps[cnsi].appCount / appsPerPage);
    cnsiResponse.total_results = cnsiApps[cnsi].appCount;

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

function mockAppsResponseWithQ(request, config) {


  var organizationGuid, spaceGuid;

  if (request.query.q.indexOf('space_guid') === 0) {
    // SpaceGuid request
    spaceGuid = request.query.q.replace('space_guid:', '');
    var index = spaceGuid.indexOf('_space');
    organizationGuid = spaceGuid.substr(0, index);
  } else if (request.query.q.indexOf('organization_guid') === 0) {
    organizationGuid = request.query.q.replace('organization_guid:', '');
  }

  var appsPerPage = parseInt(request.query['results-per-page']);
  var currentPage = parseInt(request.query['page']);


// check if organizationGuid has been supplied

  var cnsiList = utils.getCnsiList(request);

  var response = {};
  _.each(cnsiList, function (cnsi, index) {

    var appCount = 0;
    if (spaceGuid) {
      appCount = cnsiApps[cnsi].orgs[organizationGuid][spaceGuid].apps.length;
    } else {
      appCount = cnsiApps[cnsi].orgs[organizationGuid].apps.length;
    }

    var cnsiResponse = _.clone(appsTemplate);
    cnsiResponse.total_pages = Math.ceil(appCount / appsPerPage);
    cnsiResponse.total_results = appCount;

    // Calculate how many apps should there be in the current page
    cnsiResponse.resources = generateApps(cnsiApps[cnsi], currentPage, appsPerPage, config, organizationGuid, spaceGuid);

    if (currentPage < cnsiResponse.total_pages) {
      if (currentPage !== 1) {
        cnsiResponse.prev_url = generatePrevUrl(currentPage, appsPerPage, organizationGuid, spaceGuid);
      }
      cnsiResponse.next_url = generateNextUrl(currentPage, appsPerPage, organizationGuid, spaceGuid);
    } else {
      if (currentPage !== 1) {
        cnsiResponse.prev_url = generatePrevUrl(currentPage, appsPerPage, organizationGuid, spaceGuid);
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

function generateApps(cnsiStruct, currentPage, appsPerPage, config, orgGuid, spaceGuid) {

  var appCount = 0;

  var appsArray = cnsiStruct.apps;
  var totalResults = cnsiStruct.appCount;
  if (spaceGuid) {
    totalResults = cnsiStruct.orgs[orgGuid][spaceGuid].apps.length;
    appsArray = cnsiStruct.orgs[orgGuid][spaceGuid].apps;
  } else if (orgGuid) {
    totalResults = cnsiStruct.orgs[orgGuid].apps.length;
    appsArray = cnsiStruct.orgs[orgGuid].apps;

  } else {
    totalResults = cnsiStruct.appCount;
  }

  var offset = 0;
  if (totalResults <= appsPerPage) {
    // HCF is a smaller number of apps than appsPerPage
    appCount = totalResults;

  } else {

    var appsServed = (currentPage - 1) * appsPerPage;
    var remainingResults = totalResults - appsServed;
    offset = appsServed;
    if (remainingResults < appsPerPage) {
      appCount = remainingResults;
    } else {
      appCount = appsPerPage;
    }
  }

  var resources = [];
  for (var i = 0; i < appCount; i++) {

    var app = utils.clone(appsTemplate.resources[0]);
    var guidVal = appsArray[offset + i];
    app.entity.name = guidVal;
    app.metadata.guid = guidVal;

    // If an hcf.app_id is not provided, set the state to stopped
    if (_.isUndefined(config.hcf.app_id)) {
      app.entity.state = 'STOPPED';
    }
    resources.push(utils.clone(app));
  }
  return resources;
}

function generateNextUrl(pageNumber, appsPerPage, organizationGuid, spaceGuid) {

  var q = null;
  if (spaceGuid) {
    q = "q=organization_guid:" + organizationGuid + "&space_guid:" + spaceGuid;
  } else {
    q = "q=organization_guid:" + organizationGuid;

  }

  if (q) {
    return '/v2/apps?order-direction=asc' + q + '&page=' + (pageNumber + 1) + '&results-per-page=' + appsPerPage;
  }
  return '/v2/apps?order-direction=asc&page=' + (pageNumber + 1) + '&results-per-page=' + appsPerPage;
}

function generatePrevUrl(pageNumber, appsPerPage) {
  return '/v2/apps?order-direction=asc&page=' + (pageNumber - 1) + '&results-per-page=' + appsPerPage;
}

function rewriteStatsRequest(request, config) {
  request.url = request.url.replace(request.params.id, config.hcf.app_id);
  request.headers['x-cnap-cnsi-list'] = config.hcf.cnsi;
  return request;
}

function determineAppsPerOrg(cnsi, index, config) {

  var appCount = cnsi.appCount;
  var numberOfOrgs = config.serviceInstances.orgs.count;
  var numberOfSpaces = config.serviceInstances.orgs.spacesCount;

  // distributing apps across all spaces evenly
  var numberOfAppsPerSpace = Math.floor(appCount / (numberOfOrgs * numberOfSpaces));

  var remainderOfSpaceApps = Math.ceil((appCount - (numberOfAppsPerSpace * numberOfOrgs * numberOfSpaces)) / numberOfSpaces);

  var numberOfAppsPerOrg = Math.floor(appCount / numberOfOrgs);

  cnsi.orgs = {};
  cnsi.apps = [];

  var appIndex = 0;
  for (var i = 0; i < numberOfOrgs; i++) {

    var orgGuid = "org_" + i;
    cnsi.orgs[orgGuid] = {};
    cnsi.orgs[orgGuid].apps = [];
    for (var j = 0; j < numberOfSpaces; j++) {
      var spaceGuid = "org_" + i + "_space_" + j;
      cnsi.orgs[orgGuid][spaceGuid] = {};
      cnsi.orgs[orgGuid][spaceGuid].apps = [];
      for (var k = 0; k < numberOfAppsPerSpace; k++) {
        var appName = "mock_hcf_" + index + "_app_" + appIndex++;
        cnsi.orgs[orgGuid][spaceGuid].apps.push(appName);
        cnsi.orgs[orgGuid].apps.push(appName);
        cnsi.apps.push(appName);
      }
      // Add remainder app to teh last space
      if (remainderOfSpaceApps !== 0 && j == (numberOfSpaces -1)) {
        for (var g = 0; g < remainderOfSpaceApps; g++) {
          var appName = "mock_hcf_" + index + "_app_" + appIndex++;
          cnsi.orgs[orgGuid][spaceGuid].apps.push(appName);
          cnsi.orgs[orgGuid].apps.push(appName);
          cnsi.apps.push(appName);
        }
      }
    }
  }
  return cnsi;
}
