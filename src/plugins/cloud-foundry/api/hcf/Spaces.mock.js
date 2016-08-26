(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.Spaces = {

    ListAllAppsForSpace: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/spaces/' + guid + '/apps',

        response: {

          200: {

            body: {
              "guid": {
                "total_results": 1,
                "total_pages": 1,
                "prev_url": null,
                "next_url": null,
                "resources": [
                  {
                    "metadata": {
                      "guid": "91587747-004b-4a44-9adf-61c764519f71",
                      "url": "/v2/apps/91587747-004b-4a44-9adf-61c764519f71",
                      "created_at": "2016-02-19T02:04:05Z",
                      "updated_at": "2016-02-19T02:04:05Z"
                    },
                    "entity": {
                      "name": "name-2500",
                      "production": false,
                      "space_guid": "b71b5455-6d01-4846-bab9-f2af6e4e7a4f",
                      "stack_guid": "07f55326-9ced-4ff2-bb42-a23525ff9425",
                      "buildpack": null,
                      "detected_buildpack": null,
                      "environment_json": null,
                      "memory": 1024,
                      "instances": 1,
                      "disk_quota": 1024,
                      "state": "STOPPED",
                      "version": "f6bb92c2-107e-41fc-9705-9d9892e30845",
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
                      "package_updated_at": "2016-02-19T02:04:05Z",
                      "detected_start_command": "",
                      "enable_ssh": true,
                      "docker_credentials_json": {
                        "redacted_message": "[PRIVATE DATA HIDDEN]"
                      },
                      "ports": null,
                      "space_url": "/v2/spaces/b71b5455-6d01-4846-bab9-f2af6e4e7a4f",
                      "stack_url": "/v2/stacks/07f55326-9ced-4ff2-bb42-a23525ff9425",
                      "events_url": "/v2/apps/91587747-004b-4a44-9adf-61c764519f71/events",
                      "service_bindings_url": "/v2/apps/91587747-004b-4a44-9adf-61c764519f71/service_bindings",
                      "routes_url": "/v2/apps/91587747-004b-4a44-9adf-61c764519f71/routes",
                      "route_mappings_url": "/v2/apps/91587747-004b-4a44-9adf-61c764519f71/route_mappings"
                    }
                  }
                ]
              }
            }
          },

          500: {
            body: {guid: {}}
          }
        }
      };
    },

    ListAllSpaces: function () {
      return {
        url: '/pp/v1/proxy/v2/spaces',

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
                    "guid": "c414defe-a42a-424f-b7a3-01ef237202dc",
                    "url": "/v2/spaces/c414defe-a42a-424f-b7a3-01ef237202dc",
                    "created_at": "2016-02-19T02:04:03Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "name-2435",
                    "organization_guid": "43cae62a-9a5e-4e45-a11b-5cfc4fa59604",
                    "space_quota_definition_guid": null,
                    "allow_ssh": true,
                    "organization_url": "/v2/organizations/43cae62a-9a5e-4e45-a11b-5cfc4fa59604",
                    "developers_url": "/v2/spaces/c414defe-a42a-424f-b7a3-01ef237202dc/developers",
                    "managers_url": "/v2/spaces/c414defe-a42a-424f-b7a3-01ef237202dc/managers",
                    "auditors_url": "/v2/spaces/c414defe-a42a-424f-b7a3-01ef237202dc/auditors",
                    "apps_url": "/v2/spaces/c414defe-a42a-424f-b7a3-01ef237202dc/apps",
                    "routes_url": "/v2/spaces/c414defe-a42a-424f-b7a3-01ef237202dc/routes",
                    "domains_url": "/v2/spaces/c414defe-a42a-424f-b7a3-01ef237202dc/domains",
                    "service_instances_url": "/v2/spaces/c414defe-a42a-424f-b7a3-01ef237202dc/service_instances",
                    "app_events_url": "/v2/spaces/c414defe-a42a-424f-b7a3-01ef237202dc/app_events",
                    "events_url": "/v2/spaces/c414defe-a42a-424f-b7a3-01ef237202dc/events",
                    "security_groups_url": "/v2/spaces/c414defe-a42a-424f-b7a3-01ef237202dc/security_groups"
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
    },

    ListAllServiceInstancesForSpace: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/spaces/' + guid + '/service_instances',
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
                    "guid": "4986ba9d-f537-4e37-9479-0abb8da7b216",
                    "url": "/v2/service_instances/4986ba9d-f537-4e37-9479-0abb8da7b216",
                    "created_at": "2016-05-12T00:45:18Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "name-1621",
                    "credentials": {
                      "creds-key-41": "creds-val-41"
                    },
                    "service_plan_guid": "d22b3754-d093-42a2-a294-5fda6c6db44c",
                    "space_guid": guid,
                    "gateway_data": null,
                    "dashboard_url": null,
                    "type": "managed_service_instance",
                    "last_operation": null,
                    "tags": [],
                    "space_url": "/v2/spaces/" + guid,
                    "service_plan_url": "/v2/service_plans/d22b3754-d093-42a2-a294-5fda6c6db44c",
                    "service_bindings_url": "/v2/service_instances/4986ba9d-f537-4e37-9479-0abb8da7b216/service_bindings",
                    "service_keys_url": "/v2/service_instances/4986ba9d-f537-4e37-9479-0abb8da7b216/service_keys",
                    "routes_url": "/v2/service_instances/4986ba9d-f537-4e37-9479-0abb8da7b216/routes"
                  }
                }
              ]
            }
          }
        }
      };
    },

    ListAllServicesForSpace: function(guid) {
      return {
        url: '/pp/v1/proxy/v2/spaces/' + guid + '/services',
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
                    "guid": "bb90f482-4b6b-4baf-8a5a-265b8d7e115e",
                    "url": "/v2/services/bb90f482-4b6b-4baf-8a5a-265b8d7e115e",
                    "created_at": "2016-05-12T00:45:17Z",
                    "updated_at": null
                  },
                  "entity": {
                    "label": "label-44",
                    "provider": null,
                    "url": null,
                    "description": "desc-90",
                    "long_description": null,
                    "version": null,
                    "info_url": null,
                    "active": true,
                    "bindable": true,
                    "unique_id": "ebb0d295-82f5-435d-85ed-aa38068c4582",
                    "extra": null,
                    "tags": [],
                    "requires": [],
                    "documentation_url": null,
                    "service_broker_guid": "f7f4280c-c7df-4010-ba54-96786e0326f1",
                    "plan_updateable": false,
                    "service_plans_url": "/v2/services/bb90f482-4b6b-4baf-8a5a-265b8d7e115e/service_plans"
                  }
                }
              ]
            }
          }
        }
      };
    },

    ListAllServicesForSpaceWithSSO: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/spaces/' + guid + '/services',
        response: {
          200: {
            body: {
              "total_results": 3,
              "total_pages": 1,
              "prev_url": null,
              "next_url": null,
              "resources": [
                {
                  "metadata": {
                    "guid": "871e6711-2da6-42d8-992d-645fd9c930c5",
                    "url": "/v2/services/871e6711-2da6-42d8-992d-645fd9c930c5",
                    "created_at": "2016-07-26T03:48:12Z",
                    "updated_at": null
                  },
                  "entity": {
                    "label": "sso-routing",
                    "provider": null,
                    "url": null,
                    "description": "Application single sign-on service broker",
                    "long_description": null,
                    "version": null,
                    "info_url": null,
                    "active": 1,
                    "bindable": 1,
                    "unique_id": "a98eb389-64e1-475e-afc0-824394ed60d1",
                    "extra": null,
                    "tags": [

                    ],
                    "requires": [
                      "route_forwarding"
                    ],
                    "documentation_url": null,
                    "service_broker_guid": "bec439da-7d35-4a09-921c-842585a1aee1",
                    "plan_updateable": 0,
                    "service_plans_url": "/v2/services/871e6711-2da6-42d8-992d-645fd9c930c5/service_plans"
                  }
                },
                {
                  "metadata": {
                    "guid": "0b936783-2330-423b-8349-7378ece6cd1e",
                    "url": "/v2/services/0b936783-2330-423b-8349-7378ece6cd1e",
                    "created_at": "2016-07-26T04:04:32Z",
                    "updated_at": "2016-07-26T04:04:40Z"
                  },
                  "entity": {
                    "label": "Mongo",
                    "provider": null,
                    "url": null,
                    "description": "Default service",
                    "long_description": null,
                    "version": null,
                    "info_url": null,
                    "active": 1,
                    "bindable": 1,
                    "unique_id": "60204887-f232-4bff-8bcb-7954bc1a6852",
                    "extra": "{\"displayName\":\"dev-mongo\",\"longDescription\":\"MongoDB is a cross-platform document-oriented database. Classified as a NoSQL database, MongoDB uses JSON-like documents with dynamic schemas\"}",
                    "tags": [
                      "Mongo"
                    ],
                    "requires": [

                    ],
                    "documentation_url": null,
                    "service_broker_guid": "c19472bf-5644-4fa0-8d7c-e3f2c0ead312",
                    "plan_updateable": 0,
                    "service_plans_url": "/v2/services/0b936783-2330-423b-8349-7378ece6cd1e/service_plans"
                  }
                },
                {
                  "metadata": {
                    "guid": "6fe696c1-1d95-4a63-aa29-1fa404282fa2",
                    "url": "/v2/services/6fe696c1-1d95-4a63-aa29-1fa404282fa2",
                    "created_at": "2016-07-26T04:04:40Z",
                    "updated_at": null
                  },
                  "entity": {
                    "label": "MySQL",
                    "provider": null,
                    "url": null,
                    "description": "Default service",
                    "long_description": null,
                    "version": null,
                    "info_url": null,
                    "active": 1,
                    "bindable": 1,
                    "unique_id": "6ab90aeb-c7b1-4ae9-8c37-b5a9fb6a49ab",
                    "extra": "{\"displayName\":\"dev-mysql\",\"longDescription\":\"MySQL is a popular open source relational database management system.\"}",
                    "tags": [
                      "MySQL"
                    ],
                    "requires": [

                    ],
                    "documentation_url": null,
                    "service_broker_guid": "c19472bf-5644-4fa0-8d7c-e3f2c0ead312",
                    "plan_updateable": 0,
                    "service_plans_url": "/v2/services/6fe696c1-1d95-4a63-aa29-1fa404282fa2/service_plans"
                  }
                }
              ]
            }
          }
        }
      }
    }

  };

  /* eslint-enable quote-props */
})(this.mock = this.mock || {});
