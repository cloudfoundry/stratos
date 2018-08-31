(function () {
  'use strict';

  var path = require('path');
  module.exports = {
    goDestPath: path.join('src', 'github.com', 'cloudfoundry-incubator'),
    goPath: path.join('src', 'github.com', 'cloudfoundry-incubator', 'stratos'),
    getVendorPath: function (srcPath) {
      return path.join(srcPath, 'vendor', 'github.com', 'cloudfoundry-incubator', 'stratos');
    },
    getCorePath: function (srcPath, executable) {
      return path.join(srcPath, executable ? executable : '');
    },
    coreName: 'jetstream',
    outputPath: path.join(__dirname, '..', 'outputs'),
    srcPath: path.join(__dirname, 'src', 'backend'),
    pluginFolder: path.join(__dirname, '..', 'src', 'backend'),
    pluginExtFolder: path.join(__dirname, '..', 'extsrc', 'backend'),
  };
})();
