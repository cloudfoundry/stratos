(function () {
  'use strict';

  var commonSetup = require('./common.js');

  module.exports = function ($httpBackend) {
    commonSetup.setupWithoutClusters($httpBackend);
  };
})();
