(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.Routes = {

    DeleteRoute: function (guid) {
      return {
        url: '/api/cf/v2/routes/' + guid + '?recursive=true',

        response: {

          204: {
            body: {}
          },

          500: {
            body: {}
          }
        }
      };
    },

    ListAllAppsForRoute: function (guid) {
      return {
        url: '/api/cf/v2/routes/' + guid + '/apps',

        response: {

          200: {

            body: {
              "total_results": 1,
              "total_pages": 1,
              "prev_url": null,
              "next_url": null,
              "resources": [
                {
                  "metadata": {
                    "guid": "af96374d-3f82-4956-8af2-f2a7b572458e",
                    "url": "/v2/apps/af96374d-3f82-4956-8af2-f2a7b572458e",
                    "created_at": "2016-02-19T02:04:02Z",
                    "updated_at": "2016-02-19T02:04:02Z"
                  },
                  "entity": {
                    "name": "name-2381",
                    "production": false,
                    "space_guid": "9024b3ee-16df-4c91-8012-ba44f8785d2e",
                    "stack_guid": "39122b68-9cc6-4b79-8b26-7a02301b10d3",
                    "buildpack": null,
                    "detected_buildpack": null,
                    "environment_json": null,
                    "memory": 1024,
                    "instances": 1,
                    "disk_quota": 1024,
                    "state": "STOPPED",
                    "version": "78756cf3-636b-4244-a38e-bf9ee82b3178",
                    "command": null,
                    "console": false,
                    "debug": null,
                    "staging_task_id": null,
                    "package_state": "PENDING",
                    "health_check_type": "port",
                    "health_check_timeout": null,
                    "staging_failed_reason": null,
                    "staging_failed_description": null,
                    "diego": false,
                    "docker_image": null,
                    "package_updated_at": "2016-02-19T02:04:02Z",
                    "detected_start_command": "",
                    "enable_ssh": true,
                    "docker_credentials_json": {
                      "redacted_message": "[PRIVATE DATA HIDDEN]"
                    },
                    "ports": null,
                    "space_url": "/v2/spaces/9024b3ee-16df-4c91-8012-ba44f8785d2e",
                    "stack_url": "/v2/stacks/39122b68-9cc6-4b79-8b26-7a02301b10d3",
                    "events_url": "/v2/apps/af96374d-3f82-4956-8af2-f2a7b572458e/events",
                    "service_bindings_url": "/v2/apps/af96374d-3f82-4956-8af2-f2a7b572458e/service_bindings",
                    "routes_url": "/v2/apps/af96374d-3f82-4956-8af2-f2a7b572458e/routes",
                    "route_mappings_url": "/v2/apps/af96374d-3f82-4956-8af2-f2a7b572458e/route_mappings"
                  }
                }
              ]
            }
          },

          500: {
            body: {}
          }
        }
      };
    }
  };

  /* eslint-enable quote-props */
})(this.mock = this.mock || {});
