'use strict';

var helpers = require('../helpers.po');
var Q = require('../../../tools/node_modules/q');

module.exports = {
  addOrgIfMissing: addOrgIfMissing,
  addSpaceIfMissing: addSpaceIfMissing,
  deleteAppIfExisting: deleteAppIfExisting,
  fetchApp: fetchApp,
  fetchServiceExist: fetchServiceExist
};

function createHeader(cnsiGuid) {
  return {
    'x-cnap-cnsi-list': cnsiGuid,
    'x-cnap-passthrough': 'true'
  };
}

function addOrgIfMissing(cnsiGuid, orgName, username, password) {

  var req;

  return helpers.createReqAndSession(null, username, password)
    .then(function (inReq) {
      req = inReq;
      return helpers.sendRequest(req, {
        headers: createHeader(cnsiGuid),
        method: 'GET',
        url: 'pp/v1/proxy/v2/organizations?q=name IN ' + orgName
      });
    })
    .then(function (response) {
      console.log(response);
      if (response.total_results !== 0) {
        return helpers.sendRequest(req, {
          headers: createHeader(cnsiGuid),
          method: 'POST',
          url: 'pp/v1/proxy/v2/organizations'
        }, {
          name: orgName
        });
      }
    });
}

function addSpaceIfMissing(cnsiGuid, spaceName, username, password) {
  var req;

  return helpers.createReqAndSession(null, username, password)
    .then(function (inReq) {
      req = inReq;
      return helpers.sendRequest(req, {
        headers: createHeader(cnsiGuid),
        method: 'GET',
        url: 'pp/v1/proxy/v2/spaces?q=name IN ' + spaceName
      });
    })
    .then(function (response) {
      console.log(response);
      if (response.total_results !== 0) {
        return helpers.sendRequest(req, {
          headers: createHeader(cnsiGuid),
          method: 'POST',
          url: 'pp/v1/proxy/v2/spaces'
        }, {
          name: spaceName
        });
      }
    });
}

function fetchApp(appName, username, password) {
  return helpers.createReqAndSession(null, username, password)
    .then(function (req) {
      return helpers.sendRequest(req, {
        headers: createHeader(cnsiGuid),
        method: 'GET',
        url: 'pp/v1/proxy/v2/apps?q=name IN ' + appName
      });
    })
    .then(function (response) {
      console.log(response);
      return response;
    });
}

function fetchServiceExist(serviceName, username, password) {
  return helpers.createReqAndSession(null, username, password)
    .then(function (req) {
      return helpers.sendRequest(req, {
        headers: createHeader(cnsiGuid),
        method: 'GET',
        url: 'pp/v1/proxy/v2/service_instances?q=name IN ' + serviceName
      });
    })
    .then(function (response) {
      console.log(response);
      return response;
    });
}

function deleteAppIfExisting(cnsiGuid, appName, username, password) {
  var req;
  return helpers.createReqAndSession(null, username, password)
    .then(function (inReq) {
      req = inReq;
      return fetchApp(appName, username, password);
    })
    .then(function (app) {
      if (!app) {
        return Q.resolve();
      }

      console.log('Deleting e2e app');
      var promises = [];

      // Delete service instance
      if (app.entity.services) {
        var serviceInstanceGuid = 'i dont feckin know';
        promises.push(helpers.sendRequest(req, {
          headers: createHeader(cnsiGuid),
          method: 'DELETE',
          url: 'pp/v1/proxy/v2/service_instances/' + serviceInstanceGuid + '?q=recursive=true+async=false'
        }));
      }

      // Delete route
      if (app.entity.routes) {
        var routeGuid = 'i dont feckin know';
        promises.push(helpers.sendRequest(req, {
          headers: createHeader(cnsiGuid),
          method: 'DELETE',
          url: 'pp/v1/proxy/v2/routes/' + routeGuid + '?q=recursive=true+async=false'
        }));
      }

      // Delete app
      return Q.all(promises).then(function () {
        promises.push(helpers.sendRequest(req, {
          headers: createHeader(cnsiGuid),
          method: 'GET',
          url: 'pp/v1/proxy/v2/apps/' + app.metadata.guid
        }));
      });
    });
}
