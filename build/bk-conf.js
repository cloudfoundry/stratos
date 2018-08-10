(function () {
  'use strict';

  var path = require('path');
  module.exports = {
    goDestPath: path.join('src', 'github.com', 'SUSE'),
    goPath: path.join('src', 'github.com', 'SUSE', 'stratos-ui'),
    e2eSetupPath: path.join('src', 'github.com', 'SUSE', 'setup-e2e'),
    getVendorPath: function (srcPath) {
      return path.join(srcPath, 'vendor', 'github.com', 'SUSE', 'stratos-ui');
    },
    getCorePath: function (srcPath, executable) {
      return path.join(srcPath, executable ? executable : '');
    },
    coreName: 'portal-proxy',
    e2eSetupName: 'setup-e2e',
    outputPath: path.join(__dirname, '..', 'outputs'),
    srcPath: path.join(__dirname, 'src', 'backend'),
    pluginFolder: path.join(__dirname, '..', 'src', 'backend'),
    pluginExtFolder: path.join(__dirname, '..', 'extsrc', 'backend'),
  };
})();
