(function () {
  'use strict';

  var commonSetup = require('./common.js');
  var _ = require('../../../../tools/node_modules/lodash');

  module.exports = function ($httpBackend) {

    commonSetup.setupWithClusters($httpBackend);
    var apps = [];
    for (var i = 0; i < 500; i++) { apps[i] = createFakeApp(); }
    for (var j = 1; j <= 5; j++) {
      var offset = (j - 1) * 100;
      var response = {
        '8221adff-529a-4567-b57a-155fb69f1bd0': {
          total_results: 500,
          total_pages: 5,
          prev_url: null,
          next_url: null,
          resources: apps.slice(offset, offset + 100)
        }
      };

      var baseUrl = '/pp/v1/proxy/v2/apps?page=' + j;
      $httpBackend.whenGET(baseUrl + '&results-per-page=100').respond(response);
      $httpBackend.whenGET(baseUrl + '&q=space_guid:8eccd354-2bd3-4be4-b922-21905827bcb1&results-per-page=100').respond(response);
    }

    $httpBackend.whenGET('/pp/v1/proxy/v2/apps?results-per-page=1').respond({
      '8221adff-529a-4567-b57a-155fb69f1bd0': {
        total_results: 500,
        total_pages: 5,
        prev_url: null,
        next_url: null,
        resources: apps.slice(0, 1)
      }
    });
  };

  var appPattern = {
    metadata: {
      guid: '1427b1dc-8531-4c8b-a46d-8a7cbca7eef6',
      url: '/v2/apps/1427b1dc-8531-4c8b-a46d-8a7cbca7eef6',
      created_at: '2016-05-12T00:45:24Z',
      updated_at: '2016-05-12T00:45:24Z'
    },
    entity: {
      name: 'name-2044',
      production: false,
      space_guid: '98587565-c115-469b-bde1-382a569cb7b6',
      stack_guid: '1c2c21ce-7aab-4c50-abb1-917915a15d21',
      buildpack: null,
      detected_buildpack: null,
      environment_json: null,
      memory: 1024,
      instances: 1,
      disk_quota: 1024,
      state: 'STOPPED',
      version: 'b40af0c0-3980-4bb7-b147-e10f3cf7dd0e',
      command: null,
      console: false,
      debug: null,
      staging_task_id: null,
      package_state: 'PENDING',
      health_check_type: 'port',
      health_check_timeout: null,
      staging_failed_reason: null,
      staging_failed_description: null,
      diego: false,
      docker_image: null,
      package_updated_at: '2016-05-12T00:45:24Z',
      detected_start_command: '',
      enable_ssh: true,
      docker_credentials_json: {
        redacted_message: '[PRIVATE DATA HIDDEN]'
      },
      ports: null,
      space_url: '/v2/spaces/98587565-c115-469b-bde1-382a569cb7b6',
      stack_url: '/v2/stacks/1c2c21ce-7aab-4c50-abb1-917915a15d21',
      routes_url: '/v2/apps/1427b1dc-8531-4c8b-a46d-8a7cbca7eef6/routes',
      events_url: '/v2/apps/1427b1dc-8531-4c8b-a46d-8a7cbca7eef6/events',
      service_bindings_url: '/v2/apps/1427b1dc-8531-4c8b-a46d-8a7cbca7eef6/service_bindings',
      route_mappings_url: '/v2/apps/1427b1dc-8531-4c8b-a46d-8a7cbca7eef6/route_mappings'
    }
  };

  function getRandomLetter(letters) {
    return letters.charAt(Math.floor(Math.random() * letters.length));
  }

  var createRandomName = (function () {
    var count = 0;
    return function () {
      var letters = '-_01234567abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var name = [];
      for (var j = 0; j < 4; j++) { name.push(getRandomLetter(letters)); }
      name.push('#' + count++);
      return name.join('');
    };
  })();

  function createFakeApp() {
    var name = createRandomName();
    return _.assign({}, appPattern, {
      metadata: {guid: name},
      entity: {name: name}
    });
  }

})();
