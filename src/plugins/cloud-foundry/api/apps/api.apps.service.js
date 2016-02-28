(function () {
  'use strict';

  angular
    .module('cloud-foundry.api')
    .factory('cloud-foundry.api.appsService', AppsServiceFactory);

  function AppsServiceFactory() {

    function AppsService (api, $http, CollectionService) {
      CollectionService.call(this, 'apps');
      this.$http = $http;
      this.api = api;

      this.getInstances = function (guid, options) {
        var path = this.getCollectionUrl() + '/' + guid + '/instances';
        this.api.get(path, options);
      };

      this.getUsage = function (guid, options) {
        var path = this.getCollectionUrl() + '/' + guid + '/usage';
        this.api.get(path, options);
      };

      this.getFiles = function (guid, instanceIndex, filepath, options) {
        options.params = {allow_redirect: false};

        var path = this.getCollectionUrl() + '/' + guid + '/instances/' + instanceIndex + '/files/' + filepath;
        this.api.get(path, options);
      };

      this.list = function() {
        // stub out response for list
        /* eslint-disable quote-props */
        return {
          "total_results": 3,
          "total_pages": 1,
          "prev_url": null,
          "next_url": null,
          "resources": [
            {
              "metadata": {
                "guid": "8a24297c-8489-4d99-9a27-b12d217782c0",
                "url": "/v2/apps/8a24297c-8489-4d99-9a27-b12d217782c0",
                "created_at": "2016-01-26T22:20:08Z",
                "updated_at": "2016-01-26T22:20:08Z"
              },
              "entity": {
                "name": "name-215",
                "production": false,
                "space_guid": "e98f80c0-91de-4a8d-8fab-02c6bb2c0dc1",
                "stack_guid": "41bfc9c6-9349-4adf-a852-104dadd63ca4",
                "buildpack": null,
                "detected_buildpack": null,
                "environment_json": null,
                "memory": 1024,
                "instances": 1,
                "disk_quota": 1024,
                "state": "STARTED",
                "version": "81a46896-10f0-40a8-9314-357a6c7f35da",
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
                "package_updated_at": "2016-01-26T22:20:08Z",
                "detected_start_command": "",
                "enable_ssh": true,
                "docker_credentials_json": {
                  "redacted_message": "[PRIVATE DATA HIDDEN]"
                },
                "ports": null,
                "space_url": "/v2/spaces/e98f80c0-91de-4a8d-8fab-02c6bb2c0dc1",
                "stack_url": "/v2/stacks/41bfc9c6-9349-4adf-a852-104dadd63ca4",
                "events_url": "/v2/apps/8a24297c-8489-4d99-9a27-b12d217782c0/events",
                "service_bindings_url": "/v2/apps/8a24297c-8489-4d99-9a27-b12d217782c0/service_bindings",
                "routes_url": "/v2/apps/8a24297c-8489-4d99-9a27-b12d217782c0/routes"
              }
            },
            {
              "metadata": {
                "guid": "d944c87e-6184-4b5f-99f9-661dc7381bf8",
                "url": "/v2/apps/d944c87e-6184-4b5f-99f9-661dc7381bf8",
                "created_at": "2016-01-26T22:20:08Z",
                "updated_at": "2016-01-26T22:20:08Z"
              },
              "entity": {
                "name": "name-220",
                "production": false,
                "space_guid": "c848d294-9c77-43ec-a5d7-8c416343cc51",
                "stack_guid": "cbab057b-48db-4781-aa3e-a3c33573a3d4",
                "buildpack": null,
                "detected_buildpack": null,
                "environment_json": null,
                "memory": 1024,
                "instances": 1,
                "disk_quota": 1024,
                "state": "STOPPED",
                "version": "eb1eddfd-7b0b-4a92-9823-cce955b9625f",
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
                "package_updated_at": "2016-01-26T22:20:08Z",
                "detected_start_command": "",
                "enable_ssh": true,
                "docker_credentials_json": {
                  "redacted_message": "[PRIVATE DATA HIDDEN]"
                },
                "ports": null,
                "space_url": "/v2/spaces/c848d294-9c77-43ec-a5d7-8c416343cc51",
                "stack_url": "/v2/stacks/cbab057b-48db-4781-aa3e-a3c33573a3d4",
                "events_url": "/v2/apps/d944c87e-6184-4b5f-99f9-661dc7381bf8/events",
                "service_bindings_url": "/v2/apps/d944c87e-6184-4b5f-99f9-661dc7381bf8/service_bindings",
                "routes_url": "/v2/apps/d944c87e-6184-4b5f-99f9-661dc7381bf8/routes"
              }
            },
            {
              "metadata": {
                "guid": "ea957179-97f4-438b-a20d-f504f1305045",
                "url": "/v2/apps/ea957179-97f4-438b-a20d-f504f1305045",
                "created_at": "2016-01-26T22:20:08Z",
                "updated_at": "2016-01-26T22:20:08Z"
              },
              "entity": {
                "name": "name-210",
                "production": false,
                "space_guid": "6edd5300-92c8-46be-a3ca-d07cfe5bfb74",
                "stack_guid": "a29ccdc4-3241-4b47-9703-b07ad37de0a3",
                "buildpack": null,
                "detected_buildpack": null,
                "environment_json": null,
                "memory": 1024,
                "instances": 1,
                "disk_quota": 1024,
                "state": "STOPPED",
                "version": "ee2c448f-97aa-4733-ae0a-0e143671c4cb",
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
                "package_updated_at": "2016-01-26T22:20:08Z",
                "detected_start_command": "",
                "enable_ssh": true,
                "docker_credentials_json": {
                  "redacted_message": "[PRIVATE DATA HIDDEN]"
                },
                "ports": null,
                "space_url": "/v2/spaces/6edd5300-92c8-46be-a3ca-d07cfe5bfb74",
                "stack_url": "/v2/stacks/a29ccdc4-3241-4b47-9703-b07ad37de0a3",
                "events_url": "/v2/apps/ea957179-97f4-438b-a20d-f504f1305045/events",
                "service_bindings_url": "/v2/apps/ea957179-97f4-438b-a20d-f504f1305045/service_bindings",
                "routes_url": "/v2/apps/ea957179-97f4-438b-a20d-f504f1305045/routes"
              }
            }
          ]
        };
        /* eslint-enable quote-props */
      };
    }

    return AppsService;
  }

})();
