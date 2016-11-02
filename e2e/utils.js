'use strict';

var sh = require('../tools/node_modules/shelljs');
var helpers = require('./po/helpers.po');

module.exports = {
  loadE2eClient: loadE2eClient,
  unloadE2eClient: unloadE2eClient,
  loadMock: loadMock,
  loadWith: loadWith
};

function loadE2eClient() {
  // sh.exec('cp ../e2e/client/index.e2e.html ../dist', { silent: true });
  //TODO:
  // 1) cp index.html to index.e2e.html
  // 2) replace
  // <html ng-app="green-box-console" ng-strict-di>
  // with
  // <html ng-app="e2e-loader">
  // 3) inject  between '<!-- endbower -->' + ' <!-- inject:js -->'
  //   <script src="lib/angular-mocks/angular-mocks.js"></script>
  //   <script src="e2e/mocks.js"></script>
  //   <script src="e2e/loader.js"></script>
  //

  sh.exec('cp -R ../e2e/client/e2e ../dist', { silent: true });
}

function unloadE2eClient() {
  sh.exec('rm -rf ../dist/e2e', { silent: true });
  // sh.exec('rm ../dist/index.e2e.html', { silent: true });
}

function loadMock(path) {
  sh.exec('mv ../dist/e2e/' + path + '.js ../dist/e2e/mocks.js', { silent: true });
}

function loadWith(path) {
  browser.get(helpers.getHost() + '/index.e2e.html');
  loadMock(path);
}
