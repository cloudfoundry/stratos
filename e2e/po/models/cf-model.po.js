'use strict';

var helpers = require('../helpers.po');
var Q = require('../../../tools/node_modules/q');
var _ = require('../../../tools/node_modules/lodash');

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
      var json = JSON.parse(response);
      if (json.total_results === 0) {
        console.log('Adding org: ' + orgName);
        return helpers.sendRequest(req, {
          headers: createHeader(cnsiGuid),
          method: 'POST',
          url: 'pp/v1/proxy/v2/organizations'
        }, {name: orgName});
      }
    });
}

function addSpaceIfMissing(cnsiGuid, orgName, spaceName, username, password) {
  var req;

  //   developer_guids
  //     :
  //     ["9cd7966b-38b3-40b3-a29b-3d3ba59d3455"]
  //   0
  // :
  //   "9cd7966b-38b3-40b3-a29b-3d3ba59d3455"
  //   manager_guids
  //     :
  //     ["9cd7966b-38b3-40b3-a29b-3d3ba59d3455"]
  //   0
  // :
  //   "9cd7966b-38b3-40b3-a29b-3d3ba59d3455"
  //   name
  //     :
  //     "dsfsdf"
  //   organization_guid
  //     :
  //     "d00adce1-37e4-4b09-a036-d3f31803b6cd"

  return helpers.createReqAndSession(null, username, password)
    .then(function (inReq) {
      req = inReq;
      return helpers.sendRequest(req, {
        headers: createHeader(cnsiGuid),
        method: 'GET',
        url: 'pp/v1/proxy/v2/spaces?inline-relations-depth=1&include-relations=organization&q=name IN ' + spaceName
      });
    })
    .then(function (response) {
      var json = JSON.parse(response);
      console.log('Deciding on adding space: ');
      var add = false;
      if (json.total_results === 0) {
        add = true;
      } else if (json.total_results > 0) {
        var exists = _.find(json.resources, {entity: {organization: {entity: {name: orgName}}}});
        console.log(exists);
        add = !exists;
      }

      if (add) {
        console.log('Adding space: ' + spaceName);
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

function fetchApp(cnsiGuid, appName, username, password) {
  return helpers.createReqAndSession(null, username, password)
    .then(function (req) {
      return helpers.sendRequest(req, {
        headers: createHeader(cnsiGuid),
        method: 'GET',
        url: 'pp/v1/proxy/v2/apps?inline-relations-depth=1&include-relations=routes,service_bindings&q=name IN ' + appName
      });
    })
    .then(function (response) {
      var json = JSON.parse(response);
      if (json.total_results < 1) {
        return null;
      } else if (json.total_results === 1) {
        return json.resources[0];
      } else {
        return Q.reject('There should only be one app, found multiple. Add Name: ' + appName);
      }
    });
}

function fetchServiceExist(cnsiGuid, serviceName, username, password) {
  return helpers.createReqAndSession(null, username, password)
    .then(function (req) {
      return helpers.sendRequest(req, {
        headers: createHeader(cnsiGuid),
        method: 'GET',
        url: 'pp/v1/proxy/v2/service_instances?q=name IN ' + serviceName
      });
    })
    .then(function (response) {
      return JSON.parse(response);
    });
}

function deleteAppIfExisting(cnsiGuid, appName, username, password) {
  var req;
  return helpers.createReqAndSession(null, username, password)
    .then(function (inReq) {
      req = inReq;
      return fetchApp(cnsiGuid, appName, username, password);
    })
    .then(function (app) {
      if (!app) {
        return Q.resolve();
      }
      var promises = [];

      // Delete service instance
      _.forEach(app.entity.service_bindings, function (serviceBinding) {
        promises.push(helpers.sendRequest(req, {
          headers: createHeader(cnsiGuid),
          method: 'DELETE',
          url: 'pp/v1/proxy/v2/service_instances/' + serviceBinding.entity.service_instance_guid + '?recursive=true&async=false'
        }));
      });

      // Delete route
      _.forEach(app.entity.routes, function (route) {
        promises.push(helpers.sendRequest(req, {
          headers: createHeader(cnsiGuid),
          method: 'DELETE',
          url: 'pp/v1/proxy/v2/routes/' + route.metadata.guid + '?q=recursive=true&async=false'
        }));
      });

      // Delete app
      return Q.all(promises).then(function () {
        promises.push(helpers.sendRequest(req, {
          headers: createHeader(cnsiGuid),
          method: 'DELETE',
          url: 'pp/v1/proxy/v2/apps/' + app.metadata.guid
        }));
      });
    });
}
