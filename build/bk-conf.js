(function () {
  'use strict';

  var path = require('path');
  module.exports = {
    goPath: path.join('src', 'github.com', 'hpcloud', 'portal-proxy'),
    getVendorPath: function (srcPath) {
      return path.join(srcPath, 'vendor', 'github.com', 'hpcloud', 'portal-proxy');
    },
    getCorePath: function (srcPath, executable) {
      return path.join(srcPath, 'core', 'backend', executable ? executable : '');
    },
    coreName: 'portal-proxy',
    outputPath: path.join(__dirname, '..', 'outputs'),
    srcPath: path.join(__dirname, 'components')
  };
})();