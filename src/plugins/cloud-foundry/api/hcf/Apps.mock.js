(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.Apps = {

    GetAppSummary: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/apps/' + guid + '/summary',

        response: {

          200: {

            body: {
              "guid": {
                "guid": guid,
                "name": "name-2342",
                "routes": [
                  {
                    "guid": "84a911b3-16f7-4f47-afa4-581c86018600",
                    "host": "host-20",
                    "path": "",
                    "domain": {
                      "guid": "bc102838-ebd6-448e-8ea1-63f9b490dc7c",
                      "name": "domain-48.example.com"
                    }
                  }
                ],
                "running_instances": 0,
                "services": [
                  {
                    "guid": "28aa8270-ab0e-480d-b9b6-ba4ec4f15015",
                    "name": "name-2344",
                    "bound_app_count": 1,
                    "last_operation": null,
                    "dashboard_url": null,
                    "service_plan": {
                      "guid": "d22b3754-d093-42a2-a294-5fda6c6db44c",
                      "name": "name-2345",
                      "service": {
                        "guid": "67229bc6-8fc9-4fe1-b8bc-8790cdae5334",
                        "label": "label-53",
                        "provider": null,
                        "version": null
                      }
                    }
                  }
                ],
                "available_domains": [
                  {
                    "guid": "bc102838-ebd6-448e-8ea1-63f9b490dc7c",
                    "name": "domain-48.example.com",
                    "owning_organization_guid": "adee2ddb-8fa9-44cb-80f8-9c7f1589534c"
                  },
                  {
                    "guid": "e39933ad-2265-4d24-bf94-c962b2d60438",
                    "name": "customer-app-domain1.com",
                    "router_group_guid": null,
                    "router_group_types": null
                  },
                  {
                    "guid": "d664430b-1406-4d22-bc74-293581d36f0b",
                    "name": "customer-app-domain2.com",
                    "router_group_guid": null,
                    "router_group_types": null
                  }
                ],
                "production": false,
                "space_guid": "c79071fc-3e74-4d3e-912f-782b3433ccc3",
                "stack_guid": "19fb9562-b371-44e5-b008-09d3e34c2041",
                "buildpack": null,
                "detected_buildpack": null,
                "environment_json": null,
                "memory": 1024,
                "instances": 1,
                "disk_quota": 1024,
                "state": "STOPPED",
                "version": "9e3484a4-6228-41a7-a1f1-e2d16cb43876",
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
                "ports": null
              }
            }
          },

          500: {
            body: { guid: {} }
          }
        }
      };
    },

    UpdateApp: function (guid, value) {
      return {
        url: '/pp/v1/proxy/v2/apps/' + guid + '',

        response: {

          201: {

            body: {
              "guid": {
                "metadata": {
                  "guid": guid,
                  "url": "/v2/apps/6373ab80-6838-4169-8f3e-ba200fd3daca",
                  "created_at": "2016-02-19T02:03:42Z",
                  "updated_at": "2016-02-19T02:03:42Z"
                },
                "entity": {
                  "name": value.name,
                  "production": false,
                  "space_guid": "c4b18843-a768-4ac5-8c37-aeb3153aba9a",
                  "stack_guid": "17f9ca84-d83e-46ee-ba2d-5c7f9196ce55",
                  "buildpack": null,
                  "detected_buildpack": null,
                  "environment_json": null,
                  "memory": 1024,
                  "instances": 1,
                  "disk_quota": 1024,
                  "state": value.state,
                  "version": "edcde09b-c926-4440-aa9a-924758e961c4",
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
                  "package_updated_at": "2016-02-19T02:03:43Z",
                  "detected_start_command": "",
                  "enable_ssh": true,
                  "docker_credentials_json": {
                    "redacted_message": "[PRIVATE DATA HIDDEN]"
                  },
                  "ports": null,
                  "space_url": "/v2/spaces/c4b18843-a768-4ac5-8c37-aeb3153aba9a",
                  "stack_url": "/v2/stacks/17f9ca84-d83e-46ee-ba2d-5c7f9196ce55",
                  "events_url": "/v2/apps/6373ab80-6838-4169-8f3e-ba200fd3daca/events",
                  "service_bindings_url": "/v2/apps/6373ab80-6838-4169-8f3e-ba200fd3daca/service_bindings",
                  "routes_url": "/v2/apps/6373ab80-6838-4169-8f3e-ba200fd3daca/routes",
                  "route_mappings_url": "/v2/apps/6373ab80-6838-4169-8f3e-ba200fd3daca/route_mappings"
                }
              }
            }
          },

          500: {
            body: { guid: {} }
          }
        }
      };
    },

    CreateApp: function (newAppSpec) {
      return {
        url: '/pp/v1/proxy/v2/apps',

        response: {

          201: {

            body: {
              "guid": {
                "metadata": {
                  "guid": "67eff332-a6e9-4b74-8ee3-608a6fd152b7",
                  "url": "/v2/apps/67eff332-a6e9-4b74-8ee3-608a6fd152b7",
                  "created_at": "2016-02-19T02:03:43Z",
                  "updated_at": null
                },
                "entity": {
                  "name": newAppSpec.name,
                  "production": false,
                  "space_guid": newAppSpec.space_guid,
                  "stack_guid": "db232beb-9a37-47e1-983b-299770b150ce",
                  "buildpack": null,
                  "detected_buildpack": null,
                  "environment_json": {

                  },
                  "memory": 1024,
                  "instances": 1,
                  "disk_quota": 1024,
                  "state": "STOPPED",
                  "version": "105ad15b-e286-48cd-a0a7-d3dd423cac4d",
                  "command": null,
                  "console": false,
                  "debug": null,
                  "staging_task_id": null,
                  "package_state": "PENDING",
                  "health_check_type": "port",
                  "health_check_timeout": null,
                  "staging_failed_reason": null,
                  "staging_failed_description": null,
                  "diego": true,
                  "docker_image": null,
                  "package_updated_at": null,
                  "detected_start_command": "",
                  "enable_ssh": true,
                  "docker_credentials_json": {
                    "redacted_message": "[PRIVATE DATA HIDDEN]"
                  },
                  "ports": [
                    1024,
                    2000
                  ],
                  "space_url": "/v2/spaces/306ba038-4cd6-412a-bbd2-6d659924d785",
                  "stack_url": "/v2/stacks/db232beb-9a37-47e1-983b-299770b150ce",
                  "events_url": "/v2/apps/67eff332-a6e9-4b74-8ee3-608a6fd152b7/events",
                  "service_bindings_url": "/v2/apps/67eff332-a6e9-4b74-8ee3-608a6fd152b7/service_bindings",
                  "routes_url": "/v2/apps/67eff332-a6e9-4b74-8ee3-608a6fd152b7/routes",
                  "route_mappings_url": "/v2/apps/67eff332-a6e9-4b74-8ee3-608a6fd152b7/route_mappings"
                }
              }
            }
          },

          500: {
            body: { guid: {} }
          }
        }
      };
    },

    DeleteApp: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/apps/' + guid + '',

        response: {
          204: {
            body: { guid: {} }
          },
          500: {
            body: { guid: {} }
          }
        }
      };
    },

    GetDetailedStatsForStartedApp: function(guid) {
      return {
        url: '/pp/v1/proxy/v2/apps/' + guid + '/stats',

        response: {

          200: {

            body: {
              "guid": {
                "0": {
                  "state": "RUNNING",
                  "stats": {
                    "usage": {
                      "disk": 66392064,
                      "mem": 29880320,
                      "cpu": 0.13511219703079957,
                      "time": "2014-06-19 22:37:58 +0000"
                    },
                    "name": "app_name",
                    "uris": [
                      "app_name.example.com"
                    ],
                    "host": "10.0.0.1",
                    "port": 61035,
                    "uptime": 65007,
                    "mem_quota": 536870912,
                    "disk_quota": 1073741824,
                    "fds_quota": 16384
                  }
                }
              }
            }
          },

          500: {
            body: { guid: {} }
          }
        }
      };
    }
  };

  /* eslint-enable quote-props */
})(this.mock = this.mock || {});
