'use strict';

// Cluster registration helpers
var helpers = require('./helpers.po');
var hostIp = helpers.getHost();

module.exports = {

  registrationOverlay: registrationOverlay,

  addClusters: addClusters,
  clearClusters: clearClusters

};

function registrationOverlay() {
  return element(by.id('cluster-registration-overlay'));
}

function addCluster(req, cluster) {
  return new Promise(function (resolve, reject) {
    var options = {
      body: JSON.stringify(cluster)
    };
    req.post('http://' + hostIp + '/api/service-instances', options)
      .on('response', function () {
        resolve();
      });
  });
}

function addClusters() {
  var req = helpers.getRequest();

  return new Promise(function (resolve, reject) {
    helpers.createSession(req).then(function () {
      var clustersToAdd = [
        { url: 'api.15.126.233.29.xip.io', name: 'HPE Cloud Foundry_01' },
        { url: 'api.12.163.29.3.xip.io', name: 'HPE Cloud Foundry_02' },
        { url: 'api.15.13.32.22.xip.io', name: 'HPE Cloud Foundry_03' }
      ];

      var promises = clustersToAdd.map(function (c) { addCluster(req, c); });
      Promise.all(promises).then(function () {
        resolve();
      });
    });
  });
}

function removeCluster(req, id) {
  return new Promise(function (resolve, reject) {
    req.del('http://' + hostIp + '/api/service-instances/' + id)
      .on('response', function () {
        resolve();
      });
  });
}

function clearClusters() {
  var req = helpers.getRequest();

  return new Promise(function (resolve, reject) {
    helpers.createSession(req).then(function () {
      var data  = '';
      req.get('http://' + hostIp + '/api/service-instances')
        .on('data', function (responseData) {
          data += responseData;
        })
        .on('end', function () {
          if (data !== '') {
            var items = JSON.parse(data).items || [];
            if (items.length > 0) {
              var promises = items.map(function (c) { return removeCluster(req, c.id); });
              Promise.all(promises).then(function () {
                resolve();
              });
            }
          }
        })
        .on('error', function (err) {
          reject();
        });
    });
  });
}
