(function () {
  'use strict';

  var commonSetup = require('./common.js');

  module.exports = function ($httpBackend) {
    commonSetup.setupWithClusters($httpBackend);

    $httpBackend.whenGET('/pp/v1/proxy/v2/apps?page=1&results-per-page=100').respond([]);
    $httpBackend.whenGET('/pp/v1/proxy/v2/apps?page=1&q=space_guid:8eccd354-2bd3-4be4-b922-21905827bcb1&results-per-page=100').respond([]);
  };
})();
