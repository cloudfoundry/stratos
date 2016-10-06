(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.Organizations = {

    ListAllOrganizations: function (type) {
      switch (type) {
        case 'cluster_set_1':
          return {
            url: '/pp/v1/proxy/v2/organizations?exclude-relations=domains,private_domains,space_quota_definitions&inline-relations-depth=2&results-per-page=100',

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
                        "guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                        "url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                        "created_at": "2016-08-25T12:02:01Z",
                        "updated_at": null
                      },
                      "entity": {
                        "name": "BRUI",
                        "billing_enabled": false,
                        "quota_definition_guid": "1c604341-685e-4ff2-9817-4d5ae24d5861",
                        "status": "active",
                        "quota_definition_url": "/v2/quota_definitions/1c604341-685e-4ff2-9817-4d5ae24d5861",
                        "quota_definition": {
                          "metadata": {
                            "guid": "1c604341-685e-4ff2-9817-4d5ae24d5861",
                            "url": "/v2/quota_definitions/1c604341-685e-4ff2-9817-4d5ae24d5861",
                            "created_at": "2016-08-25T10:48:19Z",
                            "updated_at": null
                          },
                          "entity": {
                            "name": "default",
                            "non_basic_services_allowed": true,
                            "total_services": 100,
                            "total_routes": 1000,
                            "total_private_domains": -1,
                            "memory_limit": 10240,
                            "trial_db_allowed": false,
                            "instance_memory_limit": -1,
                            "app_instance_limit": -1,
                            "app_task_limit": -1,
                            "total_service_keys": -1,
                            "total_reserved_route_ports": 0
                          }
                        },
                        "spaces_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e/spaces",
                        "spaces": [
                          {
                            "metadata": {
                              "guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                              "url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                              "created_at": "2016-08-25T12:02:20Z",
                              "updated_at": null
                            },
                            "entity": {
                              "name": "mySpace",
                              "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                              "space_quota_definition_guid": null,
                              "allow_ssh": true,
                              "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                              "developers_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/developers",
                              "developers": [
                                {
                                  "metadata": {
                                    "guid": "a256c708-09cc-4650-ac7d-a44b291fe997",
                                    "url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997",
                                    "created_at": "2016-08-25T10:49:30Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "admin": false,
                                    "active": true,
                                    "default_space_guid": null,
                                    "spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/spaces",
                                    "organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/organizations",
                                    "managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_organizations",
                                    "billing_managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/billing_managed_organizations",
                                    "audited_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_organizations",
                                    "managed_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_spaces",
                                    "audited_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_spaces"
                                  }
                                }
                              ],
                              "managers_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/managers",
                              "managers": [
                                {
                                  "metadata": {
                                    "guid": "a256c708-09cc-4650-ac7d-a44b291fe997",
                                    "url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997",
                                    "created_at": "2016-08-25T10:49:30Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "admin": false,
                                    "active": true,
                                    "default_space_guid": null,
                                    "spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/spaces",
                                    "organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/organizations",
                                    "managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_organizations",
                                    "billing_managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/billing_managed_organizations",
                                    "audited_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_organizations",
                                    "managed_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_spaces",
                                    "audited_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_spaces"
                                  }
                                }
                              ],
                              "auditors_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/auditors",
                              "auditors": [
                                {
                                  "metadata": {
                                    "guid": "userGuid",
                                    "url": "/v2/users/userGuid",
                                    "created_at": "2016-09-02T13:01:00Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "admin": false,
                                    "active": false,
                                    "default_space_guid": null,
                                    "spaces_url": "/v2/users/userGuid/spaces",
                                    "organizations_url": "/v2/users/userGuid/organizations",
                                    "managed_organizations_url": "/v2/users/userGuid/managed_organizations",
                                    "billing_managed_organizations_url": "/v2/users/userGuid/billing_managed_organizations",
                                    "audited_organizations_url": "/v2/users/userGuid/audited_organizations",
                                    "managed_spaces_url": "/v2/users/userGuid/managed_spaces",
                                    "audited_spaces_url": "/v2/users/userGuid/audited_spaces"
                                  }
                                }
                              ],
                              "apps_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/apps",
                              "apps": [
                                {
                                  "metadata": {
                                    "guid": "82e8224e-e5f1-451f-abf1-ed8ad24023d7",
                                    "url": "/v2/apps/82e8224e-e5f1-451f-abf1-ed8ad24023d7",
                                    "created_at": "2016-08-25T12:51:43Z",
                                    "updated_at": "2016-08-25T12:51:43Z"
                                  },
                                  "entity": {
                                    "name": "neiltest5",
                                    "production": false,
                                    "space_guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "stack_guid": "82fbe52e-d3d4-451b-915f-905a93db4de9",
                                    "buildpack": null,
                                    "detected_buildpack": null,
                                    "environment_json": {

                                    },
                                    "memory": 1024,
                                    "instances": 1,
                                    "disk_quota": 1024,
                                    "state": "STOPPED",
                                    "version": "fa7fa2f8-eb28-421b-aa50-b740b591d8e7",
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
                                      8080
                                    ],
                                    "space_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "stack_url": "/v2/stacks/82fbe52e-d3d4-451b-915f-905a93db4de9",
                                    "routes_url": "/v2/apps/82e8224e-e5f1-451f-abf1-ed8ad24023d7/routes",
                                    "events_url": "/v2/apps/82e8224e-e5f1-451f-abf1-ed8ad24023d7/events",
                                    "service_bindings_url": "/v2/apps/82e8224e-e5f1-451f-abf1-ed8ad24023d7/service_bindings",
                                    "route_mappings_url": "/v2/apps/82e8224e-e5f1-451f-abf1-ed8ad24023d7/route_mappings"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "21b765a1-f12a-4df2-8aad-e4bfafc09921",
                                    "url": "/v2/apps/21b765a1-f12a-4df2-8aad-e4bfafc09921",
                                    "created_at": "2016-08-30T09:20:13Z",
                                    "updated_at": "2016-09-15T09:36:54Z"
                                  },
                                  "entity": {
                                    "name": "irfan-simple-go-test",
                                    "production": false,
                                    "space_guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "stack_guid": "82fbe52e-d3d4-451b-915f-905a93db4de9",
                                    "buildpack": null,
                                    "detected_buildpack": "Go",
                                    "environment_json": {

                                    },
                                    "memory": 1024,
                                    "instances": 1,
                                    "disk_quota": 1024,
                                    "state": "STARTED",
                                    "version": "b9a40e28-36d1-46b2-b0af-48024886eb74",
                                    "command": null,
                                    "console": false,
                                    "debug": null,
                                    "staging_task_id": "2da3aaa03b0f4a6ca54d8528c033c0d1",
                                    "package_state": "STAGED",
                                    "health_check_type": "port",
                                    "health_check_timeout": null,
                                    "staging_failed_reason": null,
                                    "staging_failed_description": null,
                                    "diego": true,
                                    "docker_image": null,
                                    "package_updated_at": "2016-08-30T09:20:19Z",
                                    "detected_start_command": "simple-go-web-app",
                                    "enable_ssh": true,
                                    "docker_credentials_json": {
                                      "redacted_message": "[PRIVATE DATA HIDDEN]"
                                    },
                                    "ports": [
                                      8080
                                    ],
                                    "space_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "stack_url": "/v2/stacks/82fbe52e-d3d4-451b-915f-905a93db4de9",
                                    "routes_url": "/v2/apps/21b765a1-f12a-4df2-8aad-e4bfafc09921/routes",
                                    "events_url": "/v2/apps/21b765a1-f12a-4df2-8aad-e4bfafc09921/events",
                                    "service_bindings_url": "/v2/apps/21b765a1-f12a-4df2-8aad-e4bfafc09921/service_bindings",
                                    "route_mappings_url": "/v2/apps/21b765a1-f12a-4df2-8aad-e4bfafc09921/route_mappings"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "1381047c-5479-45b0-8207-9056444a3aad",
                                    "url": "/v2/apps/1381047c-5479-45b0-8207-9056444a3aad",
                                    "created_at": "2016-09-06T14:39:43Z",
                                    "updated_at": "2016-09-06T14:39:44Z"
                                  },
                                  "entity": {
                                    "name": "clitest",
                                    "production": false,
                                    "space_guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "stack_guid": "82fbe52e-d3d4-451b-915f-905a93db4de9",
                                    "buildpack": null,
                                    "detected_buildpack": null,
                                    "environment_json": {

                                    },
                                    "memory": 1024,
                                    "instances": 1,
                                    "disk_quota": 1024,
                                    "state": "STOPPED",
                                    "version": "825dcc25-e6e8-4ecf-83cf-854068af42ea",
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
                                      8080
                                    ],
                                    "space_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "stack_url": "/v2/stacks/82fbe52e-d3d4-451b-915f-905a93db4de9",
                                    "routes_url": "/v2/apps/1381047c-5479-45b0-8207-9056444a3aad/routes",
                                    "events_url": "/v2/apps/1381047c-5479-45b0-8207-9056444a3aad/events",
                                    "service_bindings_url": "/v2/apps/1381047c-5479-45b0-8207-9056444a3aad/service_bindings",
                                    "route_mappings_url": "/v2/apps/1381047c-5479-45b0-8207-9056444a3aad/route_mappings"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "75dc6547-c5c1-412f-b5cd-f15b0b925e32",
                                    "url": "/v2/apps/75dc6547-c5c1-412f-b5cd-f15b0b925e32",
                                    "created_at": "2016-09-13T09:54:27Z",
                                    "updated_at": "2016-09-13T09:54:28Z"
                                  },
                                  "entity": {
                                    "name": "irfan-test",
                                    "production": false,
                                    "space_guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "stack_guid": "82fbe52e-d3d4-451b-915f-905a93db4de9",
                                    "buildpack": null,
                                    "detected_buildpack": null,
                                    "environment_json": {

                                    },
                                    "memory": 1024,
                                    "instances": 1,
                                    "disk_quota": 1024,
                                    "state": "STOPPED",
                                    "version": "faa6734a-1549-4dd6-8143-ca2ac7209184",
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
                                      8080
                                    ],
                                    "space_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "stack_url": "/v2/stacks/82fbe52e-d3d4-451b-915f-905a93db4de9",
                                    "routes_url": "/v2/apps/75dc6547-c5c1-412f-b5cd-f15b0b925e32/routes",
                                    "events_url": "/v2/apps/75dc6547-c5c1-412f-b5cd-f15b0b925e32/events",
                                    "service_bindings_url": "/v2/apps/75dc6547-c5c1-412f-b5cd-f15b0b925e32/service_bindings",
                                    "route_mappings_url": "/v2/apps/75dc6547-c5c1-412f-b5cd-f15b0b925e32/route_mappings"
                                  }
                                }
                              ],
                              "routes_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/routes",
                              "routes": [
                                {
                                  "metadata": {
                                    "guid": "1a228e6c-2d4c-49c2-acc0-20fc9ea6f03b",
                                    "url": "/v2/routes/1a228e6c-2d4c-49c2-acc0-20fc9ea6f03b",
                                    "created_at": "2016-08-25T12:51:43Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "host": "neiltest5",
                                    "path": "",
                                    "domain_guid": "91eb089c-4f18-48cb-8b92-980d7b158c9e",
                                    "space_guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "service_instance_guid": null,
                                    "port": null,
                                    "domain_url": "/v2/shared_domains/91eb089c-4f18-48cb-8b92-980d7b158c9e",
                                    "space_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "apps_url": "/v2/routes/1a228e6c-2d4c-49c2-acc0-20fc9ea6f03b/apps",
                                    "route_mappings_url": "/v2/routes/1a228e6c-2d4c-49c2-acc0-20fc9ea6f03b/route_mappings"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "a1fc4c70-fcd9-4976-91c7-43fd5e672f1f",
                                    "url": "/v2/routes/a1fc4c70-fcd9-4976-91c7-43fd5e672f1f",
                                    "created_at": "2016-08-30T09:20:14Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "host": "irfan-go",
                                    "path": "",
                                    "domain_guid": "91eb089c-4f18-48cb-8b92-980d7b158c9e",
                                    "space_guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "service_instance_guid": null,
                                    "port": null,
                                    "domain_url": "/v2/shared_domains/91eb089c-4f18-48cb-8b92-980d7b158c9e",
                                    "space_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "apps_url": "/v2/routes/a1fc4c70-fcd9-4976-91c7-43fd5e672f1f/apps",
                                    "route_mappings_url": "/v2/routes/a1fc4c70-fcd9-4976-91c7-43fd5e672f1f/route_mappings"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "95e0e987-f0d0-484f-9227-113c2ad9ecea",
                                    "url": "/v2/routes/95e0e987-f0d0-484f-9227-113c2ad9ecea",
                                    "created_at": "2016-09-06T14:39:44Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "host": "clitest",
                                    "path": "",
                                    "domain_guid": "91eb089c-4f18-48cb-8b92-980d7b158c9e",
                                    "space_guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "service_instance_guid": null,
                                    "port": null,
                                    "domain_url": "/v2/shared_domains/91eb089c-4f18-48cb-8b92-980d7b158c9e",
                                    "space_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "apps_url": "/v2/routes/95e0e987-f0d0-484f-9227-113c2ad9ecea/apps",
                                    "route_mappings_url": "/v2/routes/95e0e987-f0d0-484f-9227-113c2ad9ecea/route_mappings"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "f5d82a83-f327-4c87-829b-1556aa7e67a6",
                                    "url": "/v2/routes/f5d82a83-f327-4c87-829b-1556aa7e67a6",
                                    "created_at": "2016-09-13T09:54:28Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "host": "irfan-test",
                                    "path": "",
                                    "domain_guid": "91eb089c-4f18-48cb-8b92-980d7b158c9e",
                                    "space_guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "service_instance_guid": null,
                                    "port": null,
                                    "domain_url": "/v2/shared_domains/91eb089c-4f18-48cb-8b92-980d7b158c9e",
                                    "space_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "apps_url": "/v2/routes/f5d82a83-f327-4c87-829b-1556aa7e67a6/apps",
                                    "route_mappings_url": "/v2/routes/f5d82a83-f327-4c87-829b-1556aa7e67a6/route_mappings"
                                  }
                                }
                              ],
                              "domains_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/domains",
                              "service_instances_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/service_instances",
                              "service_instances": [
                                {
                                  "metadata": {
                                    "guid": "9a77f55d-c2b1-4c35-b482-d58c175a3ccb",
                                    "url": "/v2/service_instances/9a77f55d-c2b1-4c35-b482-d58c175a3ccb",
                                    "created_at": "2016-08-25T12:06:52Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "NEIL",
                                    "credentials": {

                                    },
                                    "service_plan_guid": "26393ae3-3fea-48d9-a47d-701dbb730845",
                                    "space_guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "gateway_data": null,
                                    "dashboard_url": null,
                                    "type": "managed_service_instance",
                                    "last_operation": {
                                      "type": "create",
                                      "state": "succeeded",
                                      "description": "",
                                      "updated_at": null,
                                      "created_at": "2016-08-25T12:06:52Z"
                                    },
                                    "tags": [

                                    ],
                                    "space_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "service_plan_url": "/v2/service_plans/26393ae3-3fea-48d9-a47d-701dbb730845",
                                    "service_bindings_url": "/v2/service_instances/9a77f55d-c2b1-4c35-b482-d58c175a3ccb/service_bindings",
                                    "service_keys_url": "/v2/service_instances/9a77f55d-c2b1-4c35-b482-d58c175a3ccb/service_keys",
                                    "routes_url": "/v2/service_instances/9a77f55d-c2b1-4c35-b482-d58c175a3ccb/routes"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "36ce0bcf-0a56-4ec5-962a-75899f549803",
                                    "url": "/v2/service_instances/36ce0bcf-0a56-4ec5-962a-75899f549803",
                                    "created_at": "2016-08-25T12:08:25Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "neilsso",
                                    "credentials": {

                                    },
                                    "service_plan_guid": "26393ae3-3fea-48d9-a47d-701dbb730845",
                                    "space_guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "gateway_data": null,
                                    "dashboard_url": null,
                                    "type": "managed_service_instance",
                                    "last_operation": {
                                      "type": "create",
                                      "state": "succeeded",
                                      "description": "",
                                      "updated_at": null,
                                      "created_at": "2016-08-25T12:08:25Z"
                                    },
                                    "tags": [

                                    ],
                                    "space_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "service_plan_url": "/v2/service_plans/26393ae3-3fea-48d9-a47d-701dbb730845",
                                    "service_bindings_url": "/v2/service_instances/36ce0bcf-0a56-4ec5-962a-75899f549803/service_bindings",
                                    "service_keys_url": "/v2/service_instances/36ce0bcf-0a56-4ec5-962a-75899f549803/service_keys",
                                    "routes_url": "/v2/service_instances/36ce0bcf-0a56-4ec5-962a-75899f549803/routes"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "bc309b3a-0d90-419d-860b-858313c8190e",
                                    "url": "/v2/service_instances/bc309b3a-0d90-419d-860b-858313c8190e",
                                    "created_at": "2016-08-25T12:34:04Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "neuik",
                                    "credentials": {

                                    },
                                    "service_plan_guid": "4c6b82b8-88b2-4d60-a137-140bc930587f",
                                    "space_guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "gateway_data": null,
                                    "dashboard_url": "http://sclr-server-int:28862/server",
                                    "type": "managed_service_instance",
                                    "last_operation": {
                                      "type": "create",
                                      "state": "succeeded",
                                      "description": "",
                                      "updated_at": null,
                                      "created_at": "2016-08-25T12:34:04Z"
                                    },
                                    "tags": [

                                    ],
                                    "space_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "service_plan_url": "/v2/service_plans/4c6b82b8-88b2-4d60-a137-140bc930587f",
                                    "service_bindings_url": "/v2/service_instances/bc309b3a-0d90-419d-860b-858313c8190e/service_bindings",
                                    "service_keys_url": "/v2/service_instances/bc309b3a-0d90-419d-860b-858313c8190e/service_keys",
                                    "routes_url": "/v2/service_instances/bc309b3a-0d90-419d-860b-858313c8190e/routes"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "d28d70fb-d02d-4903-ae27-ac04315504de",
                                    "url": "/v2/service_instances/d28d70fb-d02d-4903-ae27-ac04315504de",
                                    "created_at": "2016-08-25T12:52:33Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "ghjg",
                                    "credentials": {

                                    },
                                    "service_plan_guid": "4c6b82b8-88b2-4d60-a137-140bc930587f",
                                    "space_guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "gateway_data": null,
                                    "dashboard_url": "http://sclr-server-int:28862/server",
                                    "type": "managed_service_instance",
                                    "last_operation": {
                                      "type": "create",
                                      "state": "succeeded",
                                      "description": "",
                                      "updated_at": null,
                                      "created_at": "2016-08-25T12:52:33Z"
                                    },
                                    "tags": [

                                    ],
                                    "space_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "service_plan_url": "/v2/service_plans/4c6b82b8-88b2-4d60-a137-140bc930587f",
                                    "service_bindings_url": "/v2/service_instances/d28d70fb-d02d-4903-ae27-ac04315504de/service_bindings",
                                    "service_keys_url": "/v2/service_instances/d28d70fb-d02d-4903-ae27-ac04315504de/service_keys",
                                    "routes_url": "/v2/service_instances/d28d70fb-d02d-4903-ae27-ac04315504de/routes"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "b0eb5e6c-5bd8-46ae-9252-d92c0792a74c",
                                    "url": "/v2/user_provided_service_instances/b0eb5e6c-5bd8-46ae-9252-d92c0792a74c",
                                    "created_at": "2016-08-30T09:29:06Z",
                                    "updated_at": "2016-09-13T13:42:30Z"
                                  },
                                  "entity": {
                                    "name": "hce-21b765a1-f12a-4df2-8aad-e4bfafc09921",
                                    "credentials": {
                                      "hce_api_url": "https://aaa94425477c511e6b3ee020147e9b91-422118293.ap-northeast-2.elb.amazonaws.com:443/v2",
                                      "hce_execution_id": "1",
                                      "hce_pipeline_id": "7"
                                    },
                                    "space_guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "type": "user_provided_service_instance",
                                    "syslog_drain_url": "",
                                    "route_service_url": "",
                                    "space_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "service_bindings_url": "/v2/user_provided_service_instances/b0eb5e6c-5bd8-46ae-9252-d92c0792a74c/service_bindings",
                                    "service_keys_url": "/v2/user_provided_service_instances/b0eb5e6c-5bd8-46ae-9252-d92c0792a74c/service_keys",
                                    "routes_url": "/v2/user_provided_service_instances/b0eb5e6c-5bd8-46ae-9252-d92c0792a74c/routes"
                                  }
                                }
                              ],
                              "app_events_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/app_events",
                              "events_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/events",
                              "security_groups_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/security_groups",
                              "security_groups": [
                                {
                                  "metadata": {
                                    "guid": "4b643f11-f27c-42c1-9da1-22a59d2ea5a6",
                                    "url": "/v2/security_groups/4b643f11-f27c-42c1-9da1-22a59d2ea5a6",
                                    "created_at": "2016-08-25T10:48:19Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "public_networks",
                                    "rules": [
                                      {
                                        "destination": "0.0.0.0-9.255.255.255",
                                        "protocol": "all"
                                      },
                                      {
                                        "destination": "11.0.0.0-169.253.255.255",
                                        "protocol": "all"
                                      },
                                      {
                                        "destination": "169.255.0.0-172.15.255.255",
                                        "protocol": "all"
                                      },
                                      {
                                        "destination": "172.32.0.0-192.167.255.255",
                                        "protocol": "all"
                                      },
                                      {
                                        "destination": "192.169.0.0-255.255.255.255",
                                        "protocol": "all"
                                      }
                                    ],
                                    "running_default": true,
                                    "staging_default": true,
                                    "spaces_url": "/v2/security_groups/4b643f11-f27c-42c1-9da1-22a59d2ea5a6/spaces"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "6426b6ed-d5ec-45ba-a225-47df4d0c3d1b",
                                    "url": "/v2/security_groups/6426b6ed-d5ec-45ba-a225-47df4d0c3d1b",
                                    "created_at": "2016-08-25T10:48:19Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "dns",
                                    "rules": [
                                      {
                                        "destination": "0.0.0.0/0",
                                        "ports": "53",
                                        "protocol": "tcp"
                                      },
                                      {
                                        "destination": "0.0.0.0/0",
                                        "ports": "53",
                                        "protocol": "udp"
                                      }
                                    ],
                                    "running_default": true,
                                    "staging_default": true,
                                    "spaces_url": "/v2/security_groups/6426b6ed-d5ec-45ba-a225-47df4d0c3d1b/spaces"
                                  }
                                }
                              ]
                            }
                          },
                          {
                            "metadata": {
                              "guid": "b694bcb4-a5d0-4139-8733-b2eebb611362",
                              "url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362",
                              "created_at": "2016-09-02T15:46:48Z",
                              "updated_at": null
                            },
                            "entity": {
                              "name": "mySpace2",
                              "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                              "space_quota_definition_guid": null,
                              "allow_ssh": true,
                              "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                              "developers_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/developers",
                              "developers": [
                                {
                                  "metadata": {
                                    "guid": "a256c708-09cc-4650-ac7d-a44b291fe997",
                                    "url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997",
                                    "created_at": "2016-08-25T10:49:30Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "admin": false,
                                    "active": true,
                                    "default_space_guid": null,
                                    "spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/spaces",
                                    "organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/organizations",
                                    "managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_organizations",
                                    "billing_managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/billing_managed_organizations",
                                    "audited_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_organizations",
                                    "managed_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_spaces",
                                    "audited_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_spaces"
                                  }
                                }
                              ],
                              "managers_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/managers",
                              "managers": [
                                {
                                  "metadata": {
                                    "guid": "a256c708-09cc-4650-ac7d-a44b291fe997",
                                    "url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997",
                                    "created_at": "2016-08-25T10:49:30Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "admin": false,
                                    "active": true,
                                    "default_space_guid": null,
                                    "spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/spaces",
                                    "organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/organizations",
                                    "managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_organizations",
                                    "billing_managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/billing_managed_organizations",
                                    "audited_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_organizations",
                                    "managed_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_spaces",
                                    "audited_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_spaces"
                                  }
                                }
                              ],
                              "auditors_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/auditors",
                              "auditors": [

                              ],
                              "apps_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/apps",
                              "apps": [

                              ],
                              "routes_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/routes",
                              "routes": [

                              ],
                              "domains_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/domains",
                              "service_instances_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/service_instances",
                              "service_instances": [

                              ],
                              "app_events_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/app_events",
                              "events_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/events",
                              "security_groups_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/security_groups",
                              "security_groups": [
                                {
                                  "metadata": {
                                    "guid": "4b643f11-f27c-42c1-9da1-22a59d2ea5a6",
                                    "url": "/v2/security_groups/4b643f11-f27c-42c1-9da1-22a59d2ea5a6",
                                    "created_at": "2016-08-25T10:48:19Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "public_networks",
                                    "rules": [
                                      {
                                        "destination": "0.0.0.0-9.255.255.255",
                                        "protocol": "all"
                                      },
                                      {
                                        "destination": "11.0.0.0-169.253.255.255",
                                        "protocol": "all"
                                      },
                                      {
                                        "destination": "169.255.0.0-172.15.255.255",
                                        "protocol": "all"
                                      },
                                      {
                                        "destination": "172.32.0.0-192.167.255.255",
                                        "protocol": "all"
                                      },
                                      {
                                        "destination": "192.169.0.0-255.255.255.255",
                                        "protocol": "all"
                                      }
                                    ],
                                    "running_default": true,
                                    "staging_default": true,
                                    "spaces_url": "/v2/security_groups/4b643f11-f27c-42c1-9da1-22a59d2ea5a6/spaces"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "6426b6ed-d5ec-45ba-a225-47df4d0c3d1b",
                                    "url": "/v2/security_groups/6426b6ed-d5ec-45ba-a225-47df4d0c3d1b",
                                    "created_at": "2016-08-25T10:48:19Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "dns",
                                    "rules": [
                                      {
                                        "destination": "0.0.0.0/0",
                                        "ports": "53",
                                        "protocol": "tcp"
                                      },
                                      {
                                        "destination": "0.0.0.0/0",
                                        "ports": "53",
                                        "protocol": "udp"
                                      }
                                    ],
                                    "running_default": true,
                                    "staging_default": true,
                                    "spaces_url": "/v2/security_groups/6426b6ed-d5ec-45ba-a225-47df4d0c3d1b/spaces"
                                  }
                                }
                              ]
                            }
                          },
                          {
                            "metadata": {
                              "guid": "a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                              "url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                              "created_at": "2016-09-02T15:46:50Z",
                              "updated_at": null
                            },
                            "entity": {
                              "name": "mySpace3",
                              "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                              "space_quota_definition_guid": null,
                              "allow_ssh": true,
                              "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                              "developers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/developers",
                              "developers": [
                                {
                                  "metadata": {
                                    "guid": "a256c708-09cc-4650-ac7d-a44b291fe997",
                                    "url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997",
                                    "created_at": "2016-08-25T10:49:30Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "admin": false,
                                    "active": true,
                                    "default_space_guid": null,
                                    "spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/spaces",
                                    "organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/organizations",
                                    "managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_organizations",
                                    "billing_managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/billing_managed_organizations",
                                    "audited_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_organizations",
                                    "managed_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_spaces",
                                    "audited_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_spaces"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "userGuid",
                                    "url": "/v2/users/userGuid",
                                    "created_at": "2016-09-02T13:01:00Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "admin": false,
                                    "active": false,
                                    "default_space_guid": null,
                                    "spaces_url": "/v2/users/userGuid/spaces",
                                    "organizations_url": "/v2/users/userGuid/organizations",
                                    "managed_organizations_url": "/v2/users/userGuid/managed_organizations",
                                    "billing_managed_organizations_url": "/v2/users/userGuid/billing_managed_organizations",
                                    "audited_organizations_url": "/v2/users/userGuid/audited_organizations",
                                    "managed_spaces_url": "/v2/users/userGuid/managed_spaces",
                                    "audited_spaces_url": "/v2/users/userGuid/audited_spaces"
                                  }
                                }
                              ],
                              "managers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/managers",
                              "managers": [
                                {
                                  "metadata": {
                                    "guid": "a256c708-09cc-4650-ac7d-a44b291fe997",
                                    "url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997",
                                    "created_at": "2016-08-25T10:49:30Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "admin": false,
                                    "active": true,
                                    "default_space_guid": null,
                                    "spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/spaces",
                                    "organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/organizations",
                                    "managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_organizations",
                                    "billing_managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/billing_managed_organizations",
                                    "audited_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_organizations",
                                    "managed_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_spaces",
                                    "audited_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_spaces"
                                  }
                                }
                              ],
                              "auditors_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/auditors",
                              "auditors": [
                                {
                                  "metadata": {
                                    "guid": "userGuid",
                                    "url": "/v2/users/userGuid",
                                    "created_at": "2016-09-02T13:01:00Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "admin": false,
                                    "active": false,
                                    "default_space_guid": null,
                                    "spaces_url": "/v2/users/userGuid/spaces",
                                    "organizations_url": "/v2/users/userGuid/organizations",
                                    "managed_organizations_url": "/v2/users/userGuid/managed_organizations",
                                    "billing_managed_organizations_url": "/v2/users/userGuid/billing_managed_organizations",
                                    "audited_organizations_url": "/v2/users/userGuid/audited_organizations",
                                    "managed_spaces_url": "/v2/users/userGuid/managed_spaces",
                                    "audited_spaces_url": "/v2/users/userGuid/audited_spaces"
                                  }
                                }
                              ],
                              "apps_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/apps",
                              "apps": [

                              ],
                              "routes_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/routes",
                              "routes": [

                              ],
                              "domains_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/domains",
                              "service_instances_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/service_instances",
                              "service_instances": [

                              ],
                              "app_events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/app_events",
                              "events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/events",
                              "security_groups_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/security_groups",
                              "security_groups": [
                                {
                                  "metadata": {
                                    "guid": "4b643f11-f27c-42c1-9da1-22a59d2ea5a6",
                                    "url": "/v2/security_groups/4b643f11-f27c-42c1-9da1-22a59d2ea5a6",
                                    "created_at": "2016-08-25T10:48:19Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "public_networks",
                                    "rules": [
                                      {
                                        "destination": "0.0.0.0-9.255.255.255",
                                        "protocol": "all"
                                      },
                                      {
                                        "destination": "11.0.0.0-169.253.255.255",
                                        "protocol": "all"
                                      },
                                      {
                                        "destination": "169.255.0.0-172.15.255.255",
                                        "protocol": "all"
                                      },
                                      {
                                        "destination": "172.32.0.0-192.167.255.255",
                                        "protocol": "all"
                                      },
                                      {
                                        "destination": "192.169.0.0-255.255.255.255",
                                        "protocol": "all"
                                      }
                                    ],
                                    "running_default": true,
                                    "staging_default": true,
                                    "spaces_url": "/v2/security_groups/4b643f11-f27c-42c1-9da1-22a59d2ea5a6/spaces"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "6426b6ed-d5ec-45ba-a225-47df4d0c3d1b",
                                    "url": "/v2/security_groups/6426b6ed-d5ec-45ba-a225-47df4d0c3d1b",
                                    "created_at": "2016-08-25T10:48:19Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "dns",
                                    "rules": [
                                      {
                                        "destination": "0.0.0.0/0",
                                        "ports": "53",
                                        "protocol": "tcp"
                                      },
                                      {
                                        "destination": "0.0.0.0/0",
                                        "ports": "53",
                                        "protocol": "udp"
                                      }
                                    ],
                                    "running_default": true,
                                    "staging_default": true,
                                    "spaces_url": "/v2/security_groups/6426b6ed-d5ec-45ba-a225-47df4d0c3d1b/spaces"
                                  }
                                }
                              ]
                            }
                          }
                        ],
                        "domains_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e/domains",
                        "private_domains_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e/private_domains",
                        "users_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e/users",
                        "users": [
                          {
                            "metadata": {
                              "guid": "a256c708-09cc-4650-ac7d-a44b291fe997",
                              "url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997",
                              "created_at": "2016-08-25T10:49:30Z",
                              "updated_at": null
                            },
                            "entity": {
                              "admin": false,
                              "active": true,
                              "default_space_guid": null,
                              "spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/spaces",
                              "spaces": [
                                {
                                  "metadata": {
                                    "guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "created_at": "2016-08-25T12:02:20Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/developers",
                                    "managers_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/managers",
                                    "auditors_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/auditors",
                                    "apps_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/apps",
                                    "routes_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/routes",
                                    "domains_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/domains",
                                    "service_instances_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/service_instances",
                                    "app_events_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/app_events",
                                    "events_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/events",
                                    "security_groups_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "b694bcb4-a5d0-4139-8733-b2eebb611362",
                                    "url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362",
                                    "created_at": "2016-09-02T15:46:48Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace2",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/developers",
                                    "managers_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/managers",
                                    "auditors_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/auditors",
                                    "apps_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/apps",
                                    "routes_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/routes",
                                    "domains_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/domains",
                                    "service_instances_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/service_instances",
                                    "app_events_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/app_events",
                                    "events_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/events",
                                    "security_groups_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "created_at": "2016-09-02T15:46:50Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace3",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/developers",
                                    "managers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/managers",
                                    "auditors_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/auditors",
                                    "apps_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/apps",
                                    "routes_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/routes",
                                    "domains_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/domains",
                                    "service_instances_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/service_instances",
                                    "app_events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/app_events",
                                    "events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/events",
                                    "security_groups_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "b2ac211b-2136-4aa6-ae2b-24038e5deb17",
                                    "url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17",
                                    "created_at": "2016-09-16T11:16:51Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space",
                                    "organization_guid": "6899318e-3908-414d-b587-e22f79843f60",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/6899318e-3908-414d-b587-e22f79843f60",
                                    "developers_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/developers",
                                    "managers_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/managers",
                                    "auditors_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/auditors",
                                    "apps_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/apps",
                                    "routes_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/routes",
                                    "domains_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/domains",
                                    "service_instances_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/service_instances",
                                    "app_events_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/app_events",
                                    "events_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/events",
                                    "security_groups_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "40e579d3-d42a-43ca-8d25-6d8d8afcb26c",
                                    "url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c",
                                    "created_at": "2016-09-16T11:17:44Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space1",
                                    "organization_guid": "6899318e-3908-414d-b587-e22f79843f60",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/6899318e-3908-414d-b587-e22f79843f60",
                                    "developers_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/developers",
                                    "managers_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/managers",
                                    "auditors_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/auditors",
                                    "apps_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/apps",
                                    "routes_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/routes",
                                    "domains_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/domains",
                                    "service_instances_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/service_instances",
                                    "app_events_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/app_events",
                                    "events_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/events",
                                    "security_groups_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "6c381f5e-12e8-4a23-b67a-e44e861b506f",
                                    "url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f",
                                    "created_at": "2016-09-16T11:17:56Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space3",
                                    "organization_guid": "6899318e-3908-414d-b587-e22f79843f60",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/6899318e-3908-414d-b587-e22f79843f60",
                                    "developers_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/developers",
                                    "managers_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/managers",
                                    "auditors_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/auditors",
                                    "apps_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/apps",
                                    "routes_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/routes",
                                    "domains_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/domains",
                                    "service_instances_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/service_instances",
                                    "app_events_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/app_events",
                                    "events_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/events",
                                    "security_groups_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "bb0db513-9201-40df-bdc6-47749c6b47ea",
                                    "url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea",
                                    "created_at": "2016-09-16T17:26:04Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace",
                                    "organization_guid": "8c61829f-1811-499e-a010-e8f6f14a1258",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/8c61829f-1811-499e-a010-e8f6f14a1258",
                                    "developers_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/developers",
                                    "managers_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/managers",
                                    "auditors_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/auditors",
                                    "apps_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/apps",
                                    "routes_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/routes",
                                    "domains_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/domains",
                                    "service_instances_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/service_instances",
                                    "app_events_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/app_events",
                                    "events_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/events",
                                    "security_groups_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "770876a6-5747-4e86-a438-8567e3e366a1",
                                    "url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1",
                                    "created_at": "2016-09-19T10:54:41Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space1",
                                    "organization_guid": "19387964-0605-48b6-aa8f-47c0b802917c",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/19387964-0605-48b6-aa8f-47c0b802917c",
                                    "developers_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/developers",
                                    "managers_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/managers",
                                    "auditors_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/auditors",
                                    "apps_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/apps",
                                    "routes_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/routes",
                                    "domains_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/domains",
                                    "service_instances_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/service_instances",
                                    "app_events_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/app_events",
                                    "events_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/events",
                                    "security_groups_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "22ec6977-6920-45ea-8b7b-0ccad375c06a",
                                    "url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a",
                                    "created_at": "2016-09-19T10:54:49Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space2",
                                    "organization_guid": "19387964-0605-48b6-aa8f-47c0b802917c",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/19387964-0605-48b6-aa8f-47c0b802917c",
                                    "developers_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/developers",
                                    "managers_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/managers",
                                    "auditors_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/auditors",
                                    "apps_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/apps",
                                    "routes_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/routes",
                                    "domains_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/domains",
                                    "service_instances_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/service_instances",
                                    "app_events_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/app_events",
                                    "events_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/events",
                                    "security_groups_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/security_groups"
                                  }
                                }
                              ],
                              "organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/organizations",
                              "managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_organizations",
                              "billing_managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/billing_managed_organizations",
                              "audited_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_organizations",
                              "managed_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_spaces",
                              "managed_spaces": [
                                {
                                  "metadata": {
                                    "guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "created_at": "2016-08-25T12:02:20Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/developers",
                                    "managers_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/managers",
                                    "auditors_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/auditors",
                                    "apps_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/apps",
                                    "routes_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/routes",
                                    "domains_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/domains",
                                    "service_instances_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/service_instances",
                                    "app_events_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/app_events",
                                    "events_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/events",
                                    "security_groups_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "b694bcb4-a5d0-4139-8733-b2eebb611362",
                                    "url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362",
                                    "created_at": "2016-09-02T15:46:48Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace2",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/developers",
                                    "managers_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/managers",
                                    "auditors_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/auditors",
                                    "apps_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/apps",
                                    "routes_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/routes",
                                    "domains_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/domains",
                                    "service_instances_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/service_instances",
                                    "app_events_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/app_events",
                                    "events_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/events",
                                    "security_groups_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "created_at": "2016-09-02T15:46:50Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace3",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/developers",
                                    "managers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/managers",
                                    "auditors_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/auditors",
                                    "apps_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/apps",
                                    "routes_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/routes",
                                    "domains_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/domains",
                                    "service_instances_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/service_instances",
                                    "app_events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/app_events",
                                    "events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/events",
                                    "security_groups_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "b2ac211b-2136-4aa6-ae2b-24038e5deb17",
                                    "url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17",
                                    "created_at": "2016-09-16T11:16:51Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space",
                                    "organization_guid": "6899318e-3908-414d-b587-e22f79843f60",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/6899318e-3908-414d-b587-e22f79843f60",
                                    "developers_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/developers",
                                    "managers_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/managers",
                                    "auditors_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/auditors",
                                    "apps_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/apps",
                                    "routes_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/routes",
                                    "domains_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/domains",
                                    "service_instances_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/service_instances",
                                    "app_events_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/app_events",
                                    "events_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/events",
                                    "security_groups_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "40e579d3-d42a-43ca-8d25-6d8d8afcb26c",
                                    "url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c",
                                    "created_at": "2016-09-16T11:17:44Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space1",
                                    "organization_guid": "6899318e-3908-414d-b587-e22f79843f60",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/6899318e-3908-414d-b587-e22f79843f60",
                                    "developers_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/developers",
                                    "managers_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/managers",
                                    "auditors_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/auditors",
                                    "apps_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/apps",
                                    "routes_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/routes",
                                    "domains_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/domains",
                                    "service_instances_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/service_instances",
                                    "app_events_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/app_events",
                                    "events_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/events",
                                    "security_groups_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "6c381f5e-12e8-4a23-b67a-e44e861b506f",
                                    "url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f",
                                    "created_at": "2016-09-16T11:17:56Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space3",
                                    "organization_guid": "6899318e-3908-414d-b587-e22f79843f60",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/6899318e-3908-414d-b587-e22f79843f60",
                                    "developers_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/developers",
                                    "managers_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/managers",
                                    "auditors_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/auditors",
                                    "apps_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/apps",
                                    "routes_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/routes",
                                    "domains_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/domains",
                                    "service_instances_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/service_instances",
                                    "app_events_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/app_events",
                                    "events_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/events",
                                    "security_groups_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "bb0db513-9201-40df-bdc6-47749c6b47ea",
                                    "url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea",
                                    "created_at": "2016-09-16T17:26:04Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace",
                                    "organization_guid": "8c61829f-1811-499e-a010-e8f6f14a1258",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/8c61829f-1811-499e-a010-e8f6f14a1258",
                                    "developers_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/developers",
                                    "managers_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/managers",
                                    "auditors_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/auditors",
                                    "apps_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/apps",
                                    "routes_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/routes",
                                    "domains_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/domains",
                                    "service_instances_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/service_instances",
                                    "app_events_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/app_events",
                                    "events_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/events",
                                    "security_groups_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "770876a6-5747-4e86-a438-8567e3e366a1",
                                    "url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1",
                                    "created_at": "2016-09-19T10:54:41Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space1",
                                    "organization_guid": "19387964-0605-48b6-aa8f-47c0b802917c",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/19387964-0605-48b6-aa8f-47c0b802917c",
                                    "developers_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/developers",
                                    "managers_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/managers",
                                    "auditors_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/auditors",
                                    "apps_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/apps",
                                    "routes_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/routes",
                                    "domains_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/domains",
                                    "service_instances_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/service_instances",
                                    "app_events_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/app_events",
                                    "events_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/events",
                                    "security_groups_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "22ec6977-6920-45ea-8b7b-0ccad375c06a",
                                    "url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a",
                                    "created_at": "2016-09-19T10:54:49Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space2",
                                    "organization_guid": "19387964-0605-48b6-aa8f-47c0b802917c",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/19387964-0605-48b6-aa8f-47c0b802917c",
                                    "developers_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/developers",
                                    "managers_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/managers",
                                    "auditors_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/auditors",
                                    "apps_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/apps",
                                    "routes_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/routes",
                                    "domains_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/domains",
                                    "service_instances_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/service_instances",
                                    "app_events_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/app_events",
                                    "events_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/events",
                                    "security_groups_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/security_groups"
                                  }
                                }
                              ],
                              "audited_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_spaces",
                              "audited_spaces": [

                              ]
                            }
                          },
                          {
                            "metadata": {
                              "guid": "userGuid",
                              "url": "/v2/users/userGuid",
                              "created_at": "2016-09-02T13:01:00Z",
                              "updated_at": null
                            },
                            "entity": {
                              "admin": false,
                              "active": false,
                              "default_space_guid": null,
                              "spaces_url": "/v2/users/userGuid/spaces",
                              "spaces": [
                                {
                                  "metadata": {
                                    "guid": "a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "created_at": "2016-09-02T15:46:50Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace3",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/developers",
                                    "managers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/managers",
                                    "auditors_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/auditors",
                                    "apps_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/apps",
                                    "routes_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/routes",
                                    "domains_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/domains",
                                    "service_instances_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/service_instances",
                                    "app_events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/app_events",
                                    "events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/events",
                                    "security_groups_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/security_groups"
                                  }
                                }
                              ],
                              "organizations_url": "/v2/users/userGuid/organizations",
                              "managed_organizations_url": "/v2/users/userGuid/managed_organizations",
                              "billing_managed_organizations_url": "/v2/users/userGuid/billing_managed_organizations",
                              "audited_organizations_url": "/v2/users/userGuid/audited_organizations",
                              "managed_spaces_url": "/v2/users/userGuid/managed_spaces",
                              "managed_spaces": [

                              ],
                              "audited_spaces_url": "/v2/users/userGuid/audited_spaces",
                              "audited_spaces": [
                                {
                                  "metadata": {
                                    "guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "created_at": "2016-08-25T12:02:20Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/developers",
                                    "managers_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/managers",
                                    "auditors_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/auditors",
                                    "apps_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/apps",
                                    "routes_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/routes",
                                    "domains_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/domains",
                                    "service_instances_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/service_instances",
                                    "app_events_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/app_events",
                                    "events_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/events",
                                    "security_groups_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "created_at": "2016-09-02T15:46:50Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace3",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/developers",
                                    "managers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/managers",
                                    "auditors_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/auditors",
                                    "apps_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/apps",
                                    "routes_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/routes",
                                    "domains_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/domains",
                                    "service_instances_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/service_instances",
                                    "app_events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/app_events",
                                    "events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/events",
                                    "security_groups_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/security_groups"
                                  }
                                }
                              ]
                            }
                          }
                        ],
                        "managers_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e/managers",
                        "managers": [
                          {
                            "metadata": {
                              "guid": "a256c708-09cc-4650-ac7d-a44b291fe997",
                              "url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997",
                              "created_at": "2016-08-25T10:49:30Z",
                              "updated_at": null
                            },
                            "entity": {
                              "admin": false,
                              "active": true,
                              "default_space_guid": null,
                              "spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/spaces",
                              "spaces": [
                                {
                                  "metadata": {
                                    "guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "created_at": "2016-08-25T12:02:20Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/developers",
                                    "managers_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/managers",
                                    "auditors_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/auditors",
                                    "apps_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/apps",
                                    "routes_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/routes",
                                    "domains_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/domains",
                                    "service_instances_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/service_instances",
                                    "app_events_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/app_events",
                                    "events_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/events",
                                    "security_groups_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "b694bcb4-a5d0-4139-8733-b2eebb611362",
                                    "url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362",
                                    "created_at": "2016-09-02T15:46:48Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace2",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/developers",
                                    "managers_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/managers",
                                    "auditors_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/auditors",
                                    "apps_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/apps",
                                    "routes_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/routes",
                                    "domains_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/domains",
                                    "service_instances_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/service_instances",
                                    "app_events_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/app_events",
                                    "events_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/events",
                                    "security_groups_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "created_at": "2016-09-02T15:46:50Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace3",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/developers",
                                    "managers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/managers",
                                    "auditors_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/auditors",
                                    "apps_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/apps",
                                    "routes_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/routes",
                                    "domains_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/domains",
                                    "service_instances_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/service_instances",
                                    "app_events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/app_events",
                                    "events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/events",
                                    "security_groups_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "b2ac211b-2136-4aa6-ae2b-24038e5deb17",
                                    "url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17",
                                    "created_at": "2016-09-16T11:16:51Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space",
                                    "organization_guid": "6899318e-3908-414d-b587-e22f79843f60",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/6899318e-3908-414d-b587-e22f79843f60",
                                    "developers_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/developers",
                                    "managers_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/managers",
                                    "auditors_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/auditors",
                                    "apps_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/apps",
                                    "routes_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/routes",
                                    "domains_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/domains",
                                    "service_instances_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/service_instances",
                                    "app_events_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/app_events",
                                    "events_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/events",
                                    "security_groups_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "40e579d3-d42a-43ca-8d25-6d8d8afcb26c",
                                    "url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c",
                                    "created_at": "2016-09-16T11:17:44Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space1",
                                    "organization_guid": "6899318e-3908-414d-b587-e22f79843f60",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/6899318e-3908-414d-b587-e22f79843f60",
                                    "developers_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/developers",
                                    "managers_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/managers",
                                    "auditors_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/auditors",
                                    "apps_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/apps",
                                    "routes_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/routes",
                                    "domains_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/domains",
                                    "service_instances_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/service_instances",
                                    "app_events_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/app_events",
                                    "events_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/events",
                                    "security_groups_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "6c381f5e-12e8-4a23-b67a-e44e861b506f",
                                    "url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f",
                                    "created_at": "2016-09-16T11:17:56Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space3",
                                    "organization_guid": "6899318e-3908-414d-b587-e22f79843f60",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/6899318e-3908-414d-b587-e22f79843f60",
                                    "developers_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/developers",
                                    "managers_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/managers",
                                    "auditors_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/auditors",
                                    "apps_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/apps",
                                    "routes_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/routes",
                                    "domains_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/domains",
                                    "service_instances_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/service_instances",
                                    "app_events_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/app_events",
                                    "events_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/events",
                                    "security_groups_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "bb0db513-9201-40df-bdc6-47749c6b47ea",
                                    "url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea",
                                    "created_at": "2016-09-16T17:26:04Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace",
                                    "organization_guid": "8c61829f-1811-499e-a010-e8f6f14a1258",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/8c61829f-1811-499e-a010-e8f6f14a1258",
                                    "developers_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/developers",
                                    "managers_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/managers",
                                    "auditors_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/auditors",
                                    "apps_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/apps",
                                    "routes_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/routes",
                                    "domains_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/domains",
                                    "service_instances_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/service_instances",
                                    "app_events_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/app_events",
                                    "events_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/events",
                                    "security_groups_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "770876a6-5747-4e86-a438-8567e3e366a1",
                                    "url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1",
                                    "created_at": "2016-09-19T10:54:41Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space1",
                                    "organization_guid": "19387964-0605-48b6-aa8f-47c0b802917c",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/19387964-0605-48b6-aa8f-47c0b802917c",
                                    "developers_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/developers",
                                    "managers_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/managers",
                                    "auditors_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/auditors",
                                    "apps_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/apps",
                                    "routes_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/routes",
                                    "domains_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/domains",
                                    "service_instances_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/service_instances",
                                    "app_events_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/app_events",
                                    "events_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/events",
                                    "security_groups_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "22ec6977-6920-45ea-8b7b-0ccad375c06a",
                                    "url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a",
                                    "created_at": "2016-09-19T10:54:49Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space2",
                                    "organization_guid": "19387964-0605-48b6-aa8f-47c0b802917c",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/19387964-0605-48b6-aa8f-47c0b802917c",
                                    "developers_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/developers",
                                    "managers_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/managers",
                                    "auditors_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/auditors",
                                    "apps_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/apps",
                                    "routes_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/routes",
                                    "domains_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/domains",
                                    "service_instances_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/service_instances",
                                    "app_events_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/app_events",
                                    "events_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/events",
                                    "security_groups_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/security_groups"
                                  }
                                }
                              ],
                              "organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/organizations",
                              "managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_organizations",
                              "billing_managed_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/billing_managed_organizations",
                              "audited_organizations_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_organizations",
                              "managed_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/managed_spaces",
                              "managed_spaces": [
                                {
                                  "metadata": {
                                    "guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "created_at": "2016-08-25T12:02:20Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/developers",
                                    "managers_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/managers",
                                    "auditors_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/auditors",
                                    "apps_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/apps",
                                    "routes_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/routes",
                                    "domains_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/domains",
                                    "service_instances_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/service_instances",
                                    "app_events_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/app_events",
                                    "events_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/events",
                                    "security_groups_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "b694bcb4-a5d0-4139-8733-b2eebb611362",
                                    "url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362",
                                    "created_at": "2016-09-02T15:46:48Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace2",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/developers",
                                    "managers_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/managers",
                                    "auditors_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/auditors",
                                    "apps_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/apps",
                                    "routes_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/routes",
                                    "domains_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/domains",
                                    "service_instances_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/service_instances",
                                    "app_events_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/app_events",
                                    "events_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/events",
                                    "security_groups_url": "/v2/spaces/b694bcb4-a5d0-4139-8733-b2eebb611362/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "created_at": "2016-09-02T15:46:50Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace3",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/developers",
                                    "managers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/managers",
                                    "auditors_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/auditors",
                                    "apps_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/apps",
                                    "routes_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/routes",
                                    "domains_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/domains",
                                    "service_instances_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/service_instances",
                                    "app_events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/app_events",
                                    "events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/events",
                                    "security_groups_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "b2ac211b-2136-4aa6-ae2b-24038e5deb17",
                                    "url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17",
                                    "created_at": "2016-09-16T11:16:51Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space",
                                    "organization_guid": "6899318e-3908-414d-b587-e22f79843f60",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/6899318e-3908-414d-b587-e22f79843f60",
                                    "developers_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/developers",
                                    "managers_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/managers",
                                    "auditors_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/auditors",
                                    "apps_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/apps",
                                    "routes_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/routes",
                                    "domains_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/domains",
                                    "service_instances_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/service_instances",
                                    "app_events_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/app_events",
                                    "events_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/events",
                                    "security_groups_url": "/v2/spaces/b2ac211b-2136-4aa6-ae2b-24038e5deb17/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "40e579d3-d42a-43ca-8d25-6d8d8afcb26c",
                                    "url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c",
                                    "created_at": "2016-09-16T11:17:44Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space1",
                                    "organization_guid": "6899318e-3908-414d-b587-e22f79843f60",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/6899318e-3908-414d-b587-e22f79843f60",
                                    "developers_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/developers",
                                    "managers_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/managers",
                                    "auditors_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/auditors",
                                    "apps_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/apps",
                                    "routes_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/routes",
                                    "domains_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/domains",
                                    "service_instances_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/service_instances",
                                    "app_events_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/app_events",
                                    "events_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/events",
                                    "security_groups_url": "/v2/spaces/40e579d3-d42a-43ca-8d25-6d8d8afcb26c/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "6c381f5e-12e8-4a23-b67a-e44e861b506f",
                                    "url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f",
                                    "created_at": "2016-09-16T11:17:56Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space3",
                                    "organization_guid": "6899318e-3908-414d-b587-e22f79843f60",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/6899318e-3908-414d-b587-e22f79843f60",
                                    "developers_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/developers",
                                    "managers_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/managers",
                                    "auditors_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/auditors",
                                    "apps_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/apps",
                                    "routes_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/routes",
                                    "domains_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/domains",
                                    "service_instances_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/service_instances",
                                    "app_events_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/app_events",
                                    "events_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/events",
                                    "security_groups_url": "/v2/spaces/6c381f5e-12e8-4a23-b67a-e44e861b506f/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "bb0db513-9201-40df-bdc6-47749c6b47ea",
                                    "url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea",
                                    "created_at": "2016-09-16T17:26:04Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace",
                                    "organization_guid": "8c61829f-1811-499e-a010-e8f6f14a1258",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/8c61829f-1811-499e-a010-e8f6f14a1258",
                                    "developers_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/developers",
                                    "managers_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/managers",
                                    "auditors_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/auditors",
                                    "apps_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/apps",
                                    "routes_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/routes",
                                    "domains_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/domains",
                                    "service_instances_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/service_instances",
                                    "app_events_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/app_events",
                                    "events_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/events",
                                    "security_groups_url": "/v2/spaces/bb0db513-9201-40df-bdc6-47749c6b47ea/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "770876a6-5747-4e86-a438-8567e3e366a1",
                                    "url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1",
                                    "created_at": "2016-09-19T10:54:41Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space1",
                                    "organization_guid": "19387964-0605-48b6-aa8f-47c0b802917c",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/19387964-0605-48b6-aa8f-47c0b802917c",
                                    "developers_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/developers",
                                    "managers_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/managers",
                                    "auditors_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/auditors",
                                    "apps_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/apps",
                                    "routes_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/routes",
                                    "domains_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/domains",
                                    "service_instances_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/service_instances",
                                    "app_events_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/app_events",
                                    "events_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/events",
                                    "security_groups_url": "/v2/spaces/770876a6-5747-4e86-a438-8567e3e366a1/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "22ec6977-6920-45ea-8b7b-0ccad375c06a",
                                    "url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a",
                                    "created_at": "2016-09-19T10:54:49Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "space2",
                                    "organization_guid": "19387964-0605-48b6-aa8f-47c0b802917c",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/19387964-0605-48b6-aa8f-47c0b802917c",
                                    "developers_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/developers",
                                    "managers_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/managers",
                                    "auditors_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/auditors",
                                    "apps_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/apps",
                                    "routes_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/routes",
                                    "domains_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/domains",
                                    "service_instances_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/service_instances",
                                    "app_events_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/app_events",
                                    "events_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/events",
                                    "security_groups_url": "/v2/spaces/22ec6977-6920-45ea-8b7b-0ccad375c06a/security_groups"
                                  }
                                }
                              ],
                              "audited_spaces_url": "/v2/users/a256c708-09cc-4650-ac7d-a44b291fe997/audited_spaces",
                              "audited_spaces": [

                              ]
                            }
                          }
                        ],
                        "billing_managers_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e/billing_managers",
                        "billing_managers": [

                        ],
                        "auditors_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e/auditors",
                        "auditors": [
                          {
                            "metadata": {
                              "guid": "userGuid",
                              "url": "/v2/users/userGuid",
                              "created_at": "2016-09-02T13:01:00Z",
                              "updated_at": null
                            },
                            "entity": {
                              "admin": false,
                              "active": false,
                              "default_space_guid": null,
                              "spaces_url": "/v2/users/userGuid/spaces",
                              "spaces": [
                                {
                                  "metadata": {
                                    "guid": "a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "created_at": "2016-09-02T15:46:50Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace3",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/developers",
                                    "managers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/managers",
                                    "auditors_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/auditors",
                                    "apps_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/apps",
                                    "routes_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/routes",
                                    "domains_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/domains",
                                    "service_instances_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/service_instances",
                                    "app_events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/app_events",
                                    "events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/events",
                                    "security_groups_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/security_groups"
                                  }
                                }
                              ],
                              "organizations_url": "/v2/users/userGuid/organizations",
                              "managed_organizations_url": "/v2/users/userGuid/managed_organizations",
                              "billing_managed_organizations_url": "/v2/users/userGuid/billing_managed_organizations",
                              "audited_organizations_url": "/v2/users/userGuid/audited_organizations",
                              "managed_spaces_url": "/v2/users/userGuid/managed_spaces",
                              "managed_spaces": [

                              ],
                              "audited_spaces_url": "/v2/users/userGuid/audited_spaces",
                              "audited_spaces": [
                                {
                                  "metadata": {
                                    "guid": "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                                    "created_at": "2016-08-25T12:02:20Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/developers",
                                    "managers_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/managers",
                                    "auditors_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/auditors",
                                    "apps_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/apps",
                                    "routes_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/routes",
                                    "domains_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/domains",
                                    "service_instances_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/service_instances",
                                    "app_events_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/app_events",
                                    "events_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/events",
                                    "security_groups_url": "/v2/spaces/89a370b9-9ba3-4cb4-8f2f-22933fba2990/security_groups"
                                  }
                                },
                                {
                                  "metadata": {
                                    "guid": "a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                                    "created_at": "2016-09-02T15:46:50Z",
                                    "updated_at": null
                                  },
                                  "entity": {
                                    "name": "mySpace3",
                                    "organization_guid": "0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "space_quota_definition_guid": null,
                                    "allow_ssh": true,
                                    "organization_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e",
                                    "developers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/developers",
                                    "managers_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/managers",
                                    "auditors_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/auditors",
                                    "apps_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/apps",
                                    "routes_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/routes",
                                    "domains_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/domains",
                                    "service_instances_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/service_instances",
                                    "app_events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/app_events",
                                    "events_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/events",
                                    "security_groups_url": "/v2/spaces/a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a/security_groups"
                                  }
                                }
                              ]
                            }
                          }
                        ],
                        "app_events_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e/app_events",
                        "space_quota_definitions_url": "/v2/organizations/0eafcda6-6ffd-4cc9-b210-0b385c99888e/space_quota_definitions"
                      }
                    }
                  ]
                }
              }
            }
          };
        default:
          return {
            url: '/pp/v1/proxy/v2/organizations?results-per-page=100',

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
                        "guid": "dbc9862e-6e71-4bb8-a768-8d6597b5bd89",
                        "url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89",
                        "created_at": "2016-02-19T02:03:49Z",
                        "updated_at": null
                      },
                      "entity": {
                        "name": "the-system_domain-org-name",
                        "billing_enabled": false,
                        "quota_definition_guid": "2df4aaef-48e2-40ff-96d0-f2cbb620c3a3",
                        "status": "active",
                        "quota_definition_url": "/v2/quota_definitions/2df4aaef-48e2-40ff-96d0-f2cbb620c3a3",
                        "spaces_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/spaces",
                        "domains_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/domains",
                        "private_domains_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/private_domains",
                        "users_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/users",
                        "managers_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/managers",
                        "billing_managers_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/billing_managers",
                        "auditors_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/auditors",
                        "app_events_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/app_events",
                        "space_quota_definitions_url": "/v2/organizations/dbc9862e-6e71-4bb8-a768-8d6597b5bd89/space_quota_definitions"
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
    },

    ListAllSpacesForOrganization: function (guid) {
      return {
        url: '/pp/v1/proxy/v2/organizations/' + guid + '/spaces?results-per-page=100',

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
                    "guid": "0063f106-074b-415a-94ee-5cf3afd7db5c",
                    "url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c",
                    "created_at": "2016-02-19T02:04:00Z",
                    "updated_at": null
                  },
                  "entity": {
                    "name": "name-2294",
                    "organization_guid": "5d99d1f5-daab-418d-9ef4-e2f7aa825a61",
                    "space_quota_definition_guid": null,
                    "allow_ssh": true,
                    "organization_url": "/v2/organizations/5d99d1f5-daab-418d-9ef4-e2f7aa825a61",
                    "developers_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/developers",
                    "managers_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/managers",
                    "auditors_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/auditors",
                    "apps_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/apps",
                    "routes_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/routes",
                    "domains_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/domains",
                    "service_instances_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/service_instances",
                    "app_events_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/app_events",
                    "events_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/events",
                    "security_groups_url": "/v2/spaces/0063f106-074b-415a-94ee-5cf3afd7db5c/security_groups"
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
