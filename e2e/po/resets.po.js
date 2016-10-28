'use strict';

var helpers = require('./helpers.po');
var _ = require('../../tools/node_modules/lodash');
var Q = require('../../tools/node_modules/q');



module.exports = {

  devWorkflow: devWorkflow,

  resetAllCnsi: resetAllCnsi,
  removeAllCnsi: removeAllCnsi,
  connectAllCnsi: connectAllCnsi
};

/**
 * @function devWorkflow
 * @description Ensure the database is initialized for developer
 * workflow.
 * @param {boolean} firstTime - flag this as a first-time run
 * @returns {promise} A promise
 */
function devWorkflow(firstTime) {
  return new Promise(function (resolve, reject) {
    helpers.createReqAndSession(null, helpers.getUser(), helpers.getPassword()).then(function (req) {
      var promises = [];
      promises.push(setUser(req, !firstTime));
      promises.push(_resetAllCNSI(req));

      if (firstTime) {
        promises.push(removeUserServiceInstances(req));
      } else {
        promises.push(resetUserServiceInstances(req));
      }

      Promise.all(promises).then(function () {
        resolve();
      }, function (error) {
        console.log('Failed to set dev workflow');
        reject(error);
      }, function (error) {
        reject(error);
      });
    });
  });
}

/**
 * @function removeAllCnsi
 * @description Ensure the database is initialized for ITOps
 * admin workflow with no clusters registered.
 * @param {string?} username the username used ot create a session token
 * @param {string?} password the username used ot create a session token
 * @returns {promise} A promise
 */
function removeAllCnsi(username, password) {
  return new Promise(function (resolve, reject) {
    helpers.createReqAndSession(null, username, password).then(function (req) {
      _removeAllCnsi(req).then(function () {
        resolve();
      }, function (error) {
        console.log('Failed to remove all cnsi: ', error);
        reject(error);
      }).catch(reject);
    }, function (error) {
      reject(error);
    });
  });
}

/**
 * @function resetAllCnsi
 * @description Ensure the database is initialized for ITOps
 * admin workflow with the clusters provided as params.
 * @param {string?} username the username used ot create a session token
 * @param {string?} password the username used ot create a session token
 * @returns {promise} A promise
 */
function resetAllCnsi(username, password) {
  return new Promise(function (resolve, reject) {
    helpers.createReqAndSession(null, username, password).then(function (req) {
      _resetAllCNSI(req).then(function () {
        resolve();
      }, function (error) {
        console.log('Failed to reset all cnsi: ', error);
        reject(error);
      }).catch(reject);
    }, function (error) {
      reject(error);
    });
  });
}

function connectAllCnsi(username, password, isAdmin) {
  var req;
  return helpers.createReqAndSession(null, username, password)
    .then(function (createdReq) {
      req = createdReq;
    })
    .then(function () {
      return helpers.sendRequest(req, { method: 'GET', url: 'pp/v1/cnsis'});
    })
    .then(function (response) {
      var cnsis = JSON.parse(response);

      var promises = [];

      _.forEach(cnsis, function (cnsi) {
        var list;
        switch (cnsi.cnsi_type) {
          case 'hce':
            list = helpers.getHces();
            break;
          case 'hcf':
            list = helpers.getHcfs();
            break;
          default:
            fail('Unknown cnsi');
            break;
        }
        var found = _.find(list, function (configCnsi) {
          return _.endsWith(configCnsi.register.api_endpoint, cnsi.api_endpoint.Host);
        });
        if (found) {
          var user = isAdmin ? found.admin : found.user || found.admin;
          console.log('Connecting to cnsi with name: ', cnsi.name);
          promises.push(_connectCnsi(req, cnsi.guid, user.username, user.password));
        }
      });
      return Q.all(promises);
    });

}

/**
 * @function resetClusters
 * @description Reset clusters to original state
 * @param {object} req - the request
 * @returns {promise} A promise
 */
function _resetAllCNSI(req) {
  return new Promise(function (resolve, reject) {
    _removeAllCnsi(req).then(function () {
      var hcfs = helpers.getHcfs();

      var promises = [];
      var c;
      for (c in hcfs) {
        if (!hcfs.hasOwnProperty(c)) {
          continue;
        }
        promises.push(helpers.sendRequest(req, { method: 'POST', url: 'pp/v1/register/hcf' }, null, hcfs[c].register));
      }
      var hces = helpers.getHces();
      for (c in hces) {
        if (!hces.hasOwnProperty(c)) {
          continue;
        }
        promises.push(helpers.sendRequest(req, { method: 'POST', url: 'pp/v1/register/hce' }, null, hces[c].register));
      }

      Promise.all(promises).then(function () {
        resolve();
      }, function (error) {
        reject(error);
      });
    }, reject).catch(reject);
  });
}

/**
 * @function removeClusters
 * @description Remove all clusters
 * @param {object} req - the request
 * @returns {Promise} A promise
 */
function _removeAllCnsi(req) {
  return new Promise(function (resolve, reject) {
    helpers.sendRequest(req, { method: 'GET', url: 'pp/v1/cnsis' }).then(function (data) {
      data = data.trim();
      data = JSON.parse(data);

      if (!data || !data.length) {
        resolve();
        return;
      }
      var promises = data.map(function (c) {
        return helpers.sendRequest(req, { method: 'POST', url: 'pp/v1/unregister' }, '', {cnsi_guid: c.guid});
      });
      Promise.all(promises).then(resolve, reject);

    }, reject);
  });
}

function _connectCnsi(req, cnsiGuid, username, password) {
  return helpers.sendRequest(req, { method: 'POST', url: 'pp/v1/auth/login/cnsi' }, null, {
    cnsi_guid: cnsiGuid,
    username: username,
    password: password
  });
}

/**
 * @function resetUserServiceInstances
 * @description Reset user service instances to original state
 * @param {object} req - the request
 * @returns {Promise} A promise
 */
function resetUserServiceInstances(req) {
  throw 'deprecated (contacts old endpoint, needs updating';

  // return new Promise(function (resolve, reject) {
  //   removeUserServiceInstances(req).then(function () {
  //     var serviceInstancesToAdd = [
  //       'api.15.126.233.29.xip.io',
  //       'api.12.163.29.3.xip.io',
  //       'api.15.13.32.22.xip.io'
  //     ];
  //     var postUrl = 'service-instances/user/connect';
  //     var promises = serviceInstancesToAdd.map(function (instanceUrl) {
  //       return helpers.sendRequest(req, 'POST', postUrl, { url: instanceUrl });
  //     });
  //     Promise.all(promises).then(function () {
  //       resolve();
  //     });
  //   }, reject);
  // });
}

/**
 * @function removeUserServiceInstances
 * @description Remove all user service instances
 * @param {object} req - the request
 * @returns {Promise} A promise
 */
function removeUserServiceInstances(req) {
  throw 'deprecated (contacts old endpoint, needs updating';

  // return new Promise(function (resolve, reject) {
  //   var data = '';
  //   req.get('http://' + host + '/api/service-instances/user')
  //     .on('data', function (responseData) {
  //       data += responseData;
  //     })
  //     .on('end', function () {
  //       if (data && data !== '') {
  //         var items = JSON.parse(data).items || [];
  //         if (items.length > 0) {
  //           var promises = items.map(function (c) {
  //             var url = 'service-instances/user/' + c.id;
  //             return helpers.sendRequest(req, 'DELETE', url, {});
  //           });
  //           Promise.all(promises).then(function () {
  //             resolve();
  //           });
  //         } else {
  //           resolve();
  //         }
  //       } else {
  //         resolve();
  //       }
  //     })
  //     .on('error', reject);
  // });
}

/**
 * @function setUser
 * @description Set user registered state
 * @param {object} req - the request
 * @param {boolean} registered - the registered state
 * @returns {Promise} A promise
 */
function setUser(req, registered) {
  throw 'deprecated (contacts old endpoint, needs updating';

  // return new Promise(function (resolve, reject) {
  //   var data = '';
  //   req.get('http://' + host + '/api/users/loggedIn')
  //     .on('data', function (responseData) {
  //       data += responseData;
  //     })
  //     .on('end', function () {
  //       var user = JSON.parse(data);
  //       var body = { registered: registered };
  //       if (Object.keys(user).length === 0) {
  //         helpers.sendRequest(req, 'POST', 'users', body)
  //           .then(function () {
  //             resolve();
  //           }, reject);
  //       } else if (user.registered !== registered) {
  //         helpers.sendRequest(req, 'PUT', 'users/' + user.id, body)
  //           .then(function () {
  //             resolve();
  //           }, reject);
  //       }
  //     })
  //     .on('error', reject);
  // });
}
