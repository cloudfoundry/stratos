'use strict';

var sh = require('../tools/node_modules/shelljs');
var helpers = require('./po/helpers.po');
var fs = require('fs');

module.exports = {
  loadE2eClient: loadE2eClient,
  unloadE2eClient: unloadE2eClient,
  loadMock: loadMock,
  loadWith: loadWith
};

var indexSource = '../dist/index.html';
var indexDestination = '../dist/index.e2e.html';

function loadE2eClient() {
  // Make a copy of the existing index.html file and create an index.e2e.html. We will visit this page during tests
  sh.exec('cp ' + indexSource + ' ' + indexDestination, { silent: true });

  // Update the new index.e2.html
  fs.readFile(indexDestination, 'utf8', function (err, data) {
    if (err) { throw err; }

    // Replace the ng-app with the custom loader
    var result = data.replace('<html ng-app="green-box-console" ng-strict-di>', '<html ng-app="e2e-loader">');
    // Add the required js script elements
    result = result.replace('<!-- inject:js -->', '<script src="lib/angular-mocks/angular-mocks.js"></script>\n<script src="e2e/mocks.js"></script>\n<script src="e2e/loader.js"></script>\n<!-- inject:js -->');

    // Write that shizzle out
    fs.writeFile(indexDestination, result, 'utf8', function (err) {
      if (err) { throw err; }
    });
  });

  // Copy over the supporting JS files. This includes the custom response loader and custom responses
  sh.exec('cp -R ../e2e/client/e2e ../dist', { silent: true });
}

function unloadE2eClient() {
  sh.exec('rm -rf ../dist/e2e', { silent: true });
  sh.exec('rm ' + indexDestination, { silent: true });
}

function loadMock(path) {
  // Load the file that will determine the custom responses
  sh.exec('mv ../dist/e2e/' + path + '.js ../dist/e2e/mocks.js', { silent: true });
}

function loadWith(path) {
  browser.get(helpers.getHost() + '/index.e2e.html');
  loadMock(path);
}
