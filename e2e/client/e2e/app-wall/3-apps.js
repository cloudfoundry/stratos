(function () {
  'use strict';

  var commonSetup = require('./common.js');

  module.exports = function ($httpBackend) {
    commonSetup.setupWithClusters($httpBackend);

    // Apps responses
    $httpBackend.whenGET('/pp/v1/proxy/v2/apps?page=1&results-per-page=100').respond(getAppsResponse());
    $httpBackend.whenGET('/pp/v1/proxy/v2/apps?page=1&q=space_guid:8eccd354-2bd3-4be4-b922-21905827bcb1&results-per-page=100').respond(getAppsResponse());

    var res = getAppsResponse();
    res['8221adff-529a-4567-b57a-155fb69f1bd0'].resources = res['8221adff-529a-4567-b57a-155fb69f1bd0'].resources.slice(0, 1);
    $httpBackend.whenGET('/pp/v1/proxy/v2/apps?results-per-page=1').respond(res);
  };

  function getAppsResponse() {
    return {
      '8221adff-529a-4567-b57a-155fb69f1bd0': {
        total_results: 3,
        total_pages: 1,
        prev_url: null,
        next_url: null,
        resources: [
          {
            metadata: {
              guid: '1427b1dc-8531-4c8b-a46d-8a7cbca7eef6',
              url: '/v2/apps/1427b1dc-8531-4c8b-a46d-8a7cbca7eef6',
              created_at: '2016-05-12T00:45:24Z',
              updated_at: '2016-05-12T00:45:24Z'
            },
            entity: {
              name: 'opq',
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
          },
          {
            metadata: {
              guid: '9ba2ef10-b735-4808-9b43-2ccdeacc5f5b',
              url: '/v2/apps/9ba2ef10-b735-4808-9b43-2ccdeacc5f5b',
              created_at: '2016-05-12T00:45:24Z',
              updated_at: '2016-05-12T00:45:24Z'
            },
            entity: {
              name: 'abc',
              production: false,
              space_guid: 'dcc199a1-9e89-4a0d-b2b1-4b450ec7cc7d',
              stack_guid: '8df51835-9415-49db-b491-2c7b5f7bcb8e',
              buildpack: null,
              detected_buildpack: null,
              environment_json: null,
              memory: 1024,
              instances: 1,
              disk_quota: 1024,
              state: 'STOPPED',
              version: '15258458-8a11-46c8-834a-139a9dc1070c',
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
              space_url: '/v2/spaces/dcc199a1-9e89-4a0d-b2b1-4b450ec7cc7d',
              stack_url: '/v2/stacks/8df51835-9415-49db-b491-2c7b5f7bcb8e',
              routes_url: '/v2/apps/9ba2ef10-b735-4808-9b43-2ccdeacc5f5b/routes',
              events_url: '/v2/apps/9ba2ef10-b735-4808-9b43-2ccdeacc5f5b/events',
              service_bindings_url: '/v2/apps/9ba2ef10-b735-4808-9b43-2ccdeacc5f5b/service_bindings',
              route_mappings_url: '/v2/apps/9ba2ef10-b735-4808-9b43-2ccdeacc5f5b/route_mappings'
            }
          },
          {
            metadata: {
              guid: 'a744fecb-43cc-4eba-85d8-d320ea7e9f6b',
              url: '/v2/apps/a744fecb-43cc-4eba-85d8-d320ea7e9f6b',
              created_at: '2016-05-12T00:45:24Z',
              updated_at: '2016-05-12T00:45:24Z'
            },
            entity: {
              name: 'xyz',
              production: false,
              space_guid: '133b6131-ef78-4faa-b7d6-8243c8fc8475',
              stack_guid: 'e681bdca-2d8c-4507-9406-fdb591afda32',
              buildpack: null,
              detected_buildpack: null,
              environment_json: null,
              memory: 1024,
              instances: 1,
              disk_quota: 1024,
              state: 'STOPPED',
              version: '5df3717e-e5d5-4e29-abd1-09832ff30416',
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
              space_url: '/v2/spaces/133b6131-ef78-4faa-b7d6-8243c8fc8475',
              stack_url: '/v2/stacks/e681bdca-2d8c-4507-9406-fdb591afda32',
              routes_url: '/v2/apps/a744fecb-43cc-4eba-85d8-d320ea7e9f6b/routes',
              events_url: '/v2/apps/a744fecb-43cc-4eba-85d8-d320ea7e9f6b/events',
              service_bindings_url: '/v2/apps/a744fecb-43cc-4eba-85d8-d320ea7e9f6b/service_bindings',
              route_mappings_url: '/v2/apps/a744fecb-43cc-4eba-85d8-d320ea7e9f6b/route_mappings'
            }
          }
        ]
      }
    };
  }
})();

