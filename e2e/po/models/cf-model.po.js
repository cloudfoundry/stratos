/* eslint-disable angular/json-functions */

(function () {
  'use strict';

  var helpers = require('../helpers.po');
  var Q = require('../../../tools/node_modules/q');
  var _ = require('../../../tools/node_modules/lodash');

  module.exports = {
    addOrgIfMissing: addOrgIfMissing,
    addSpaceIfMissing: addSpaceIfMissing,
    deleteAppIfExisting: deleteAppIfExisting,
    fetchApp: fetchApp,
    fetchServiceExist: fetchServiceExist,
    fetchUsers: fetchUsers
  };

  function createHeader(cnsiGuid) {
    return {
      'x-cnap-cnsi-list': cnsiGuid,
      'x-cnap-passthrough': 'true'
    };
  }

  function addOrgIfMissing(cnsiGuid, orgName, adminGuid, userGuid) {

    var req, added;

    return helpers.createReqAndSession(null)
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
          added = true;
          return helpers.sendRequest(req, {
            headers: createHeader(cnsiGuid),
            method: 'POST',
            url: 'pp/v1/proxy/v2/organizations'
          }, {name: orgName}).then(function (response) {
            return JSON.parse(response);
          });
        }
        return Q.resolve(json.resources[0]);
      })
      .then(function (newOrg) {
        if (!added) {
          // No need to mess around with permissions, it exists already.
          return Q.resolve(newOrg);
        }
        var orgGuid = newOrg.metadata.guid;

        var addUsers = [];
        addUsers.push(helpers.sendRequest(req, {
          headers: createHeader(cnsiGuid),
          method: 'PUT',
          url: 'pp/v1/proxy/v2/organizations/' + orgGuid + '/users/' + adminGuid
        }));
        addUsers.push(helpers.sendRequest(req, {
          headers: createHeader(cnsiGuid),
          method: 'PUT',
          url: 'pp/v1/proxy/v2/organizations/' + orgGuid + '/users/' + userGuid
        }));

        // Add user to org users
        return Q.all(addUsers)
          .then(function () {
            return helpers.sendRequest(req, {
              headers: createHeader(cnsiGuid),
              method: 'PUT',
              url: 'pp/v1/proxy/v2/organizations/' + orgGuid + '/managers/' + adminGuid
            });
          })
          .then(function () {
            return newOrg;
          });
      });
  }

  function addSpaceIfMissing(cnsiGuid, orgGuid, orgName, spaceName, adminGuid, userGuid) {
    var req;

    return helpers.createReqAndSession()
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
        var add = false;
        if (json.total_results === 0) {
          add = true;
        } else if (json.total_results > 0) {
          add = !_.find(json.resources, {entity: {organization: {entity: {name: orgName}}}});
        }

        if (add) {
          return helpers.sendRequest(req, {
            headers: createHeader(cnsiGuid),
            method: 'POST',
            url: 'pp/v1/proxy/v2/spaces'
          }, {
            name: spaceName,
            manager_guids: [adminGuid],
            developer_guids: [userGuid, adminGuid],
            organization_guid: orgGuid
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

  function deleteAppIfExisting(cnsiGuid, hceCnsiGuid, appName, username, password) {
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

          // attempt to delete pipeline if exists
          if (hceCnsiGuid && _.has(serviceBinding, 'entity.credentials.hce_pipeline_id')) {
            promises.push(helpers.sendRequest(req, {
              headers: createHeader(hceCnsiGuid),
              method: 'DELETE',
              url: 'pp/v1/proxy/v2/projects/' + serviceBinding.entity.credentials.hce_pipeline_id
            })).catch(function () {
              //noop
            });

          }

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

  function fetchUsers(cnsiGuid) {
    return helpers.createReqAndSession(null, helpers.getAdminUser(), helpers.getAdminPassword())
      .then(function (req) {
        return helpers.sendRequest(req, {
          headers: createHeader(cnsiGuid),
          method: 'GET',
          url: 'pp/v1/proxy/v2/users'
        });
      })
      .then(function (response) {
        var json = JSON.parse(response);
        return json.resources;
      });
  }
})();
