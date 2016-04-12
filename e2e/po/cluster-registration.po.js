'use strict';

// Cluster registration helpers
var helpers = require('./helpers.po');
var hostIp = helpers.getHost();
var addClusterFormName = 'addClusterFormCtrl.addClusterForm';

module.exports = {

  registrationOverlay: registrationOverlay,
  clusterMessageBox: clusterMessageBox,
  clusterTable: clusterTable,
  clusterTableRows: clusterTableRows,
  addClusterFromMessageBox: addClusterFromMessageBox,
  addClusterFromTable: addClusterFromTable,
  removeClusterButton: removeClusterButton,
  removeClusterFromTable: removeClusterFromTable,

  addClusterForm: addClusterForm,
  addClusterFormFields: addClusterFormFields,
  fillAddClusterForm: fillAddClusterForm,
  registerButton: registerButton,
  cancel: cancel,
  registerCluster: registerCluster,

  addClusters: addClusters,
  clearClusters: clearClusters

};

function registrationOverlay() {
  return element(by.id('cluster-registration-overlay'));
}

function clusterMessageBox() {
  return registrationOverlay().element(by.css('.message-box'));
}

function clusterTable() {
  return registrationOverlay().element(by.css('cluster-registration-list'))
    .element(by.css('table'));
}

function clusterTableRows() {
  return clusterTable().all(by.css('tbody tr[ng-repeat]'));
}

function addClusterFromMessageBox() {
  clusterMessageBox().element(by.buttonText('Add Cluster')).click();
  browser.driver.sleep(1000);
}

function addClusterFromTable() {
  clusterTable().element(by.buttonText('Add Cluster')).click();
  browser.driver.sleep(1000);
}

function removeClusterButton(index) {
  return clusterTableRows().get(index).element(by.buttonText('remove'));
}

function removeClusterFromTable(index) {
  removeClusterButton(index).click();
}

/**
 * Add Cluster Form page objects
 */
function addClusterForm() {
  return registrationOverlay().element(by.css('flyout'))
    .element(by.css('form[name="' + addClusterFormName + '"]'));
}

function addClusterFormFields() {
  return helpers.getFormFields(addClusterFormName);
}

function registerButton() {
  return helpers.getForm(addClusterFormName)
    .element(by.buttonText('Register'));
}

function cancel() {
  helpers.getForm(addClusterFormName)
    .element(by.buttonText('Cancel')).click();
  browser.driver.sleep(1000);
}

function fillAddClusterForm(address, name) {
  var fields = helpers.getFormFields(addClusterFormName);
  fields.get(0).clear();
  fields.get(1).clear();
  fields.get(0).sendKeys(address || '');
  fields.get(1).sendKeys(name || '');
}

function registerCluster() {
  registerButton().click();
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
    helpers.createSession(req, 'admin', 'admin').then(function () {
      var data = '';
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
