'use strict';

var sh = require('../tools/node_modules/shelljs');

module.exports = {
  loadE2eClient: loadE2eClient,
  unloadE2eClient: unloadE2eClient,
  loadMock: loadMock
};

function loadE2eClient() {
  sh.exec('cp ../e2e/client/index.e2e.html ../dist', { silent: true });
  sh.exec('cp -R ../e2e/client/e2e ../dist', { silent: true });
}

function unloadE2eClient() {
  sh.exec('rm -rf ../dist/e2e', { silent: true });
  sh.exec('rm ../dist/index.e2e.html', { silent: true });
}

function loadMock(path) {
  sh.exec('mv ../dist/e2e/' + path + '.mocks.js ../dist/e2e/mocks.js', { silent: true });
}
