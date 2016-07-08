'use strict';

var request = require('../../tools/node_modules/request');
var helpers = require('./helpers.po');
var host = helpers.getHost();
var adminUser = browser.params.adminUser || 'admin';
var adminPassword = browser.params.adminPassword || 'admin';

module.exports = {

  devWorkflow: devWorkflow,
  zeroClusterAdminWorkflow: zeroClusterAdminWorkflow,
  nClustersAdminWorkflow: nClustersAdminWorkflow

};

/**
 * @function devWorkflow
 * @description Ensure the database is initialized for developer
 * workflow.
 * @param {boolean} firstTime - flag this as a first-time run
 * @returns {Promise} A promise
 */
function devWorkflow(firstTime) {
  var req = newRequest();

  return new Promise(function (resolve, reject) {
    createSession(req, 'dev', 'dev').then(function () {
      var promises = [];
      promises.push(setUser(req, !firstTime));
      promises.push(resetClusters(req));

      if (firstTime) {
        promises.push(removeUserServiceInstances(req));
      } else {
        promises.push(resetUserServiceInstances(req));
      }

      Promise.all(promises).then(function () {
        resolve();
      });
    });
  });
}

/**
 * @function zeroClusterAdminWorkflow
 * @description Ensure the database is initialized for ITOps
 * admin workflow with no clusters registered.
 * @returns {Promise} A promise
 */
function zeroClusterAdminWorkflow() {
  var req = newRequest();

  return new Promise(function (resolve, reject) {
    createSession(req, adminUser, adminPassword).then(function () {
      removeClusters(req).then(function () {
        resolve();
      }, function () {
        reject();
      });
    });
  });
}

/**
 * @function nClustersAdminWorkflow
 * @description Ensure the database is initialized for ITOps
 * admin workflow with clusters registered.
 * @returns {Promise} A promise
 */
function nClustersAdminWorkflow() {
  var req = newRequest();

  return new Promise(function (resolve, reject) {
    createSession(req, adminUser, adminPassword).then(function () {
      var promises = [];
      promises.push(resetClusters(req));

      Promise.all(promises).then(function () {
        resolve();
      });
    });
  });
}

/**
 * @function newRequest
 * @description Create a new request
 * @returns {object} A newly created request
 */
function newRequest() {
  var cookieJar = request.jar();
  return request.defaults({
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    jar: cookieJar
  });
}

/**
 * @function sendRequest
 * @description Send request
 * @param {object} req - the request
 * @param {string} method - the request method (GET, POST, ...)
 * @param {string} url - the request URL
 * @param {object} body - the request body
 * @returns {Promise} A promise
 */
function sendRequest(req, method, url, body) {
  return new Promise(function (resolve, reject) {
    req({
      method: method,
      url: 'http://' + host + '/api/' + url,
      body: JSON.stringify(body)
    }).on('response', function (response) {
      if (response.statusCode === 200) {
        resolve();
      } else {
        reject();
      }
    });
  });
}

/**
 * @function createSession
 * @description Create a session
 * @param {object} req - the request
 * @param {string} username - the Stratos username
 * @param {string} password - the Stratos password
 * @returns {Promise} A promise
 */
function createSession(req, username, password) {
  return new Promise(function (resolve, reject) {
    var options = {
      body: JSON.stringify({
        username: username || 'dev',
        password: password || 'dev'
      })
    };
    req.post('http://' + host + '/pp/v1/auth/login/uaa', options)
      .on('response', function (response) {

        if (response.statusCode === 200) {
          resolve();
        } else {
          reject();
        }
      });
  });
}

/**
 * @function resetClusters
 * @description Reset clusters to original state
 * @param {object} req - the request
 * @returns {Promise} A promise
 */
function resetClusters(req) {
  return new Promise(function (resolve, reject) {
    removeClusters(req).then(function () {
      var clustersToAdd = [
        {url: 'api.15.126.233.29.xip.io', name: 'HPE Cloud Foundry_01'},
        {url: 'api.12.163.29.3.xip.io', name: 'HPE Cloud Foundry_02'},
        {url: 'api.15.13.32.22.xip.io', name: 'HPE Cloud Foundry_03'}
      ];

      var promises = clustersToAdd.map(function (c) {
        return sendRequest(req, 'POST', 'service-instances', c);
      });
      Promise.all(promises).then(function () {
        resolve();
      });
    }, function () {
      reject();
    });
  });
}

/**
 * @function removeClusters
 * @description Remove all clusters
 * @param {object} req - the request
 * @returns {Promise} A promise
 */
function removeClusters(req) {
  return new Promise(function (resolve, reject) {
    var data = '';
    req.get('http://' + host + '/api/service-instances')
      .on('data', function (responseData) {
        data += responseData;
      })
      .on('end', function () {
        data = data.trim();
        if (data && data !== '') {
          var items = JSON.parse(data).items || [];
          if (items.length > 0) {
            var promises = items.map(function (c) {
              return sendRequest(req, 'DELETE', 'service-instances/' + c.id, {});
            });
            Promise.all(promises).then(function () {
              resolve();
            });
          } else {
            resolve();
          }
        } else {
          resolve();
        }
      })
      .on('error', function (err) {
        reject();
      });
  });
}

/**
 * @function resetUserServiceInstances
 * @description Reset user service instances to original state
 * @param {object} req - the request
 * @returns {Promise} A promise
 */
function resetUserServiceInstances(req) {
  return new Promise(function (resolve, reject) {
    removeUserServiceInstances(req).then(function () {
      var serviceInstancesToAdd = [
        'api.15.126.233.29.xip.io',
        'api.12.163.29.3.xip.io',
        'api.15.13.32.22.xip.io'
      ];
      var postUrl = 'service-instances/user/connect';
      var promises = serviceInstancesToAdd.map(function (instanceUrl) {
        return sendRequest(req, 'POST', postUrl, {url: instanceUrl});
      });
      Promise.all(promises).then(function () {
        resolve();
      });
    }, function () {
      reject();
    });
  });
}

/**
 * @function removeUserServiceInstances
 * @description Remove all user service instances
 * @param {object} req - the request
 * @returns {Promise} A promise
 */
function removeUserServiceInstances(req) {
  return new Promise(function (resolve, reject) {
    var data = '';
    req.get('http://' + host + '/api/service-instances/user')
      .on('data', function (responseData) {
        data += responseData;
      })
      .on('end', function () {
        if (data && data !== '') {
          var items = JSON.parse(data).items || [];
          if (items.length > 0) {
            var promises = items.map(function (c) {
              var url = 'service-instances/user/' + c.id;
              return sendRequest(req, 'DELETE', url, {});
            });
            Promise.all(promises).then(function () {
              resolve();
            });
          } else {
            resolve();
          }
        } else {
          resolve();
        }
      })
      .on('error', function (err) {
        reject();
      });
  });
}

/**
 * @function setUser
 * @description Set user registered state
 * @param {object} req - the request
 * @param {boolean} registered - the registered state
 * @returns {Promise} A promise
 */
function setUser(req, registered) {
  return new Promise(function (resolve, reject) {
    var data = '';
    req.get('http://' + host + '/api/users/loggedIn')
      .on('data', function (responseData) {
        data += responseData;
      })
      .on('end', function () {
        var user = JSON.parse(data);
        var body = {registered: registered};
        if (Object.keys(user).length === 0) {
          sendRequest(req, 'POST', 'users', body)
            .then(function () {
              resolve();
            }, function (err) {
              reject();
            });
        } else if (user.registered !== registered) {
          sendRequest(req, 'PUT', 'users/' + user.id, body)
            .then(function () {
              resolve();
            }, function () {
              reject();
            });
        }
      });
  });
}
