(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.Apps = {

    ListAllApps: function () {
      return {
        url: '/pp/v1/proxy/v2/apps?results-per-page=1',

        response: {
          200: {
            body: {
              'caf2bccb-b594-4d78-bd60-4d4947a74182': {
                'total_results': 4,
                'total_pages': 4,
                'prev_url': null,
                'next_url': '/v2/apps?order-direction=asc\u0026page=2\u0026results-per-page=1',
                'resources': [{
                  'metadata': {
                    'guid': '0a66e4e0-bf59-43f9-8f62-203fe504e2f7',
                    'url': '/v2/apps/0a66e4e0-bf59-43f9-8f62-203fe504e2f7',
                    'created_at': '2016-10-28T13:55:48Z',
                    'updated_at': '2016-11-01T14:38:37Z'
                  },
                  'entity': {
                    'name': 'rc-test-1',
                    'production': false,
                    'space_guid': '4e102665-1138-46ea-9bf3-5766070fb8bd',
                    'stack_guid': 'b55ebf93-a0b7-4f27-b30f-5273c37af661',
                    'buildpack': null,
                    'detected_buildpack': 'node.js 1.5.18',
                    'detected_buildpack_guid': '37f697af-47e1-47c0-adcc-30609e98769d',
                    'environment_json': {'sadasd': 'asdasd'},
                    'memory': 32,
                    'instances': 1,
                    'disk_quota': 1024,
                    'state': 'STARTED',
                    'version': 'f150f598-8b45-4f4e-afa4-6b52bc37137d',
                    'command': null,
                    'console': false,
                    'debug': null,
                    'staging_task_id': '229923080a4c457b9503e310807e32b5',
                    'package_state': 'STAGED',
                    'health_check_type': 'port',
                    'health_check_timeout': null,
                    'staging_failed_reason': null,
                    'staging_failed_description': null,
                    'diego': true,
                    'docker_image': null,
                    'package_updated_at': '2016-10-28T14:02:08Z',
                    'detected_start_command': 'node server.js',
                    'enable_ssh': true,
                    'docker_credentials_json': {'redacted_message': '[PRIVATE DATA HIDDEN]'},
                    'ports': [8080],
                    'space_url': '/v2/spaces/4e102665-1138-46ea-9bf3-5766070fb8bd',
                    'stack_url': '/v2/stacks/b55ebf93-a0b7-4f27-b30f-5273c37af661',
                    'routes_url': '/v2/apps/0a66e4e0-bf59-43f9-8f62-203fe504e2f7/routes',
                    'events_url': '/v2/apps/0a66e4e0-bf59-43f9-8f62-203fe504e2f7/events',
                    'service_bindings_url': '/v2/apps/0a66e4e0-bf59-43f9-8f62-203fe504e2f7/service_bindings',
                    'route_mappings_url': '/v2/apps/0a66e4e0-bf59-43f9-8f62-203fe504e2f7/route_mappings'
                  }
                }]
              }
            }
          }
        }
      };
    },

    GetAppSummary: function (guid, spaceGuid) {

      spaceGuid = spaceGuid || 'spaceGuid';

      return {
        url: '/pp/v1/proxy/v2/apps/' + guid + '/summary',

        response: {

          200: {

            body: {
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
              "space_guid": spaceGuid,
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
          },

          500: {
            body: {}
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
          },

          500: {
            body: {}
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
                "environment_json": {},
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
          },

          500: {
            body: {}
          }
        }
      };
    },

    DeleteApp: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/apps/' + guid + '',

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

    GetDetailedStatsForStartedApp: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/apps/' + guid + '/stats',

        response: {

          200: {

            body: {
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
          },

          500: {
            body: {}
          }
        }
      };
    },

    ListAllServiceBindingsForApp: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/apps/' + guid + '/service_bindings',
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
                    "guid": "065a62a1-a1d0-4cf0-b2b5-9833299bdc76",
                    "url": "/v2/service_bindings/065a62a1-a1d0-4cf0-b2b5-9833299bdc76",
                    "created_at": "2016-05-12T00:45:22Z",
                    "updated_at": null
                  },
                  "entity": {
                    "app_guid": guid,
                    "service_instance_guid": "6441a69e-d403-48a4-b86f-8184b302490b",
                    "credentials": {
                      "creds-key-60": "creds-val-60"
                    },
                    "binding_options": {},
                    "gateway_data": null,
                    "gateway_name": "",
                    "syslog_drain_url": null,
                    "volume_mounts": [],
                    "app_url": "/v2/apps/09ad0ee0-b35d-40eb-b7a3-25dd072f8964",
                    "service_instance_url": "/v2/service_instances/6441a69e-d403-48a4-b86f-8184b302490b"
                  }
                }
              ]
            }
          },

          400: {
            body: {}
          }
        }
      }
    },

    GetEnvForApp: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/apps/' + guid + '/env',
        response: {
          200: {
            body: {
              "staging_env_json": {
                "STAGING_ENV": "staging_value"
              },
              "running_env_json": {
                "RUNNING_ENV": "running_value"
              },
              "environment_json": {
                "env_var": "env_val"
              },
              "system_env_json": {
                "VCAP_SERVICES": {
                  "label-19": [
                    {"name": "instance_123"},
                    {"name": "instance_456"}
                  ]
                }
              },
              "application_env_json": {
                "VCAP_APPLICATION": {
                  "limits": {
                    "fds": 16384,
                    "mem": 1024,
                    "disk": 1024
                  },
                  "application_name": "name-1840",
                  "application_uris": [],
                  "name": "name-1840",
                  "space_name": "name-1841",
                  "space_id": "5afc57f0-3283-48be-89ae-4cfe99c3acde",
                  "uris": [],
                  "users": null,
                  "version": "b80b288d-585d-4dd0-a9f3-3263c07f460b",
                  "application_version": "b80b288d-585d-4dd0-a9f3-3263c07f460b",
                  "application_id": "02e4e483-c566-47be-89bc-565d4dae7be6"
                }
              }
            }
          },

          400: {
            body: {}
          }
        }
      };
    },

    RetrieveApp: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/apps/' + guid + '?include-relations=organization,space&inline-relations-depth=2',
        response: {
          200: {
            body: {
              "metadata": {
                "guid": guid,
                "url": "/v2/apps/" + guid,
                "created_at": "2016-10-15T17:12:52Z",
                "updated_at": "2016-10-20T11:30:20Z"
              },
              "entity": {
                "name": "node-env",
                "production": false,
                "space_guid": "ece5299a-35e8-4ecf-96ad-e1ec0df1073f",
                "stack_guid": "f7ea50c4-cf7d-4935-b0dc-279c72e2bbc5",
                "buildpack": null,
                "detected_buildpack": "node.js 1.5.18",
                "detected_buildpack_guid": "00b92f7a-d298-44bc-b9a6-afd751321cb6",
                "environment_json": {},
                "memory": 31,
                "instances": 0,
                "disk_quota": 1024,
                "state": "STARTED",
                "version": "887a058b-da40-4ac4-a3ac-6cc21b18f050",
                "command": null,
                "console": false,
                "debug": null,
                "staging_task_id": "aec4cad6529a428e90256726bda988ff",
                "package_state": "STAGED",
                "health_check_type": "port",
                "health_check_timeout": null,
                "staging_failed_reason": null,
                "staging_failed_description": null,
                "diego": true,
                "docker_image": null,
                "package_updated_at": "2016-10-17T15:02:59Z",
                "detected_start_command": "node server.js",
                "enable_ssh": true,
                "docker_credentials_json": {
                  "redacted_message": "[PRIVATE DATA HIDDEN]"
                },
                "ports": [
                  8080
                ],
                "space_url": "/v2/spaces/ece5299a-35e8-4ecf-96ad-e1ec0df1073f",
                "space": {
                  "metadata": {
                    "guid": "ece5299a-35e8-4ecf-96ad-e1ec0df1073f",
                    "url": "/v2/spaces/ece5299a-35e8-4ecf-96ad-e1ec0df1073f",
                    "created_at": "2016-10-15T17:11:11Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "Dev",
                    "organization_guid": "4f95b8fd-69b4-4b2b-a4e4-d45b74bdf099",
                    "space_quota_definition_guid": null,
                    "allow_ssh": true,
                    "organization_url": "/v2/organizations/4f95b8fd-69b4-4b2b-a4e4-d45b74bdf099",
                    "organization": {
                      "metadata": {
                        "guid": "4f95b8fd-69b4-4b2b-a4e4-d45b74bdf099",
                        "url": "/v2/organizations/4f95b8fd-69b4-4b2b-a4e4-d45b74bdf099",
                        "created_at": "2016-10-15T17:10:42Z",
                        "updated_at": null
                      },
                      "entity": {
                        "name": "Bristol",
                        "billing_enabled": false,
                        "quota_definition_guid": "7b742342-cdb4-4550-9601-181ff5944cfc",
                        "status": "active",
                        "quota_definition_url": "/v2/quota_definitions/7b742342-cdb4-4550-9601-181ff5944cfc",
                        "spaces_url": "/v2/organizations/4f95b8fd-69b4-4b2b-a4e4-d45b74bdf099/spaces",
                        "domains_url": "/v2/organizations/4f95b8fd-69b4-4b2b-a4e4-d45b74bdf099/domains",
                        "private_domains_url": "/v2/organizations/4f95b8fd-69b4-4b2b-a4e4-d45b74bdf099/private_domains",
                        "users_url": "/v2/organizations/4f95b8fd-69b4-4b2b-a4e4-d45b74bdf099/users",
                        "managers_url": "/v2/organizations/4f95b8fd-69b4-4b2b-a4e4-d45b74bdf099/managers",
                        "billing_managers_url": "/v2/organizations/4f95b8fd-69b4-4b2b-a4e4-d45b74bdf099/billing_managers",
                        "auditors_url": "/v2/organizations/4f95b8fd-69b4-4b2b-a4e4-d45b74bdf099/auditors",
                        "app_events_url": "/v2/organizations/4f95b8fd-69b4-4b2b-a4e4-d45b74bdf099/app_events",
                        "space_quota_definitions_url": "/v2/organizations/4f95b8fd-69b4-4b2b-a4e4-d45b74bdf099/space_quota_definitions"
                      }
                    },
                    "developers_url": "/v2/spaces/ece5299a-35e8-4ecf-96ad-e1ec0df1073f/developers",
                    "managers_url": "/v2/spaces/ece5299a-35e8-4ecf-96ad-e1ec0df1073f/managers",
                    "auditors_url": "/v2/spaces/ece5299a-35e8-4ecf-96ad-e1ec0df1073f/auditors",
                    "apps_url": "/v2/spaces/ece5299a-35e8-4ecf-96ad-e1ec0df1073f/apps",
                    "routes_url": "/v2/spaces/ece5299a-35e8-4ecf-96ad-e1ec0df1073f/routes",
                    "domains_url": "/v2/spaces/ece5299a-35e8-4ecf-96ad-e1ec0df1073f/domains",
                    "service_instances_url": "/v2/spaces/ece5299a-35e8-4ecf-96ad-e1ec0df1073f/service_instances",
                    "app_events_url": "/v2/spaces/ece5299a-35e8-4ecf-96ad-e1ec0df1073f/app_events",
                    "events_url": "/v2/spaces/ece5299a-35e8-4ecf-96ad-e1ec0df1073f/events",
                    "security_groups_url": "/v2/spaces/ece5299a-35e8-4ecf-96ad-e1ec0df1073f/security_groups"
                  }
                },
                "stack_url": "/v2/stacks/f7ea50c4-cf7d-4935-b0dc-279c72e2bbc5",
                "routes_url": "/v2/apps/d87c4e68-a486-443f-b83e-fc9536f8478f/routes",
                "events_url": "/v2/apps/d87c4e68-a486-443f-b83e-fc9536f8478f/events",
                "service_bindings_url": "/v2/apps/d87c4e68-a486-443f-b83e-fc9536f8478f/service_bindings",
                "route_mappings_url": "/v2/apps/d87c4e68-a486-443f-b83e-fc9536f8478f/route_mappings"
              }
            }
          },

          400: {
            body: {}
          }
        }
      };
    }
  };

  /* eslint-enable quote-props */
})(this.mock = this.mock || {});
