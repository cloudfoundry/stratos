(function (mock) {
    'use strict';

    /* eslint-disable quote-props */
    mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

    // NOTE: This is not complete, I've just dont the minimum I required for Endpoints/ACL tests
    mock.cloudFoundryAPI.Users = {

      ListAllUsers: function () {
        return {
          url: '/pp/v1/proxy/v2/users',

          response: {
            201: {
              body: {
                "metadata": {
                  "guid": "a9bf1ec7-48f5-49e0-befb-4c3602591325",
                  "url": "/v2/routes/a9bf1ec7-48f5-49e0-befb-4c3602591325",
                  "created_at": "2016-02-19T02:04:02Z",
                  "updated_at": null
                },
                "entity": {
                  "host": "host-25",
                  "path": "",
                  "domain_guid": "b7dafe61-0077-4017-adf1-17433e1926c3",
                  "space_guid": "b3bfcbb3-b786-41c0-b700-108db832e1db",
                  "service_instance_guid": null,
                  "port": 0,
                  "domain_url": "/v2/domains/b7dafe61-0077-4017-adf1-17433e1926c3",
                  "space_url": "/v2/spaces/b3bfcbb3-b786-41c0-b700-108db832e1db",
                  "apps_url": "/v2/routes/a9bf1ec7-48f5-49e0-befb-4c3602591325/apps"
                }
              }
            },

            500: {
              body: {guid: {}}
            }
          }
        };
      },

      // Organizations
      ListAllAuditedOrganizationsForUser: function (guid) {

        return {
          url: '/pp/v1/proxy/v2/users/' + guid + '/audited_organizations?results-per-page=100',

          success: {
            response: {
              data: {
                total_results: 0,
                total_pages: 0,
                prev_url: null,
                next_url: null,
                resources: []
              }

            },
            code: 200
          }
        };
      },

      ListAllBillingManagedOrganizationsForUser: function (guid) {
        return {
          url: '/pp/v1/proxy/v2/users/' + guid + '/billing_managed_organizations?results-per-page=100',
          success: {
            response: {
              data: {
                total_results: 0,
                total_pages: 0,
                prev_url: null,
                next_url: null,
                resources: []
              }
            },
            code: 200
          }

        };
      },

      ListAllManagedOrganizationsForUser: function (guid) {
        return {
          url: '/pp/v1/proxy/v2/users/' + guid + '/managed_organizations?results-per-page=100',

          success: {
            code: 200,
            is_manager: {
              response: {
                data: {
                  total_results: 1,
                  total_pages: 1,
                  prev_url: null,
                  next_url: null,
                  resources: [
                    {
                      metadata: {
                        guid: "guid",
                        url: "/v2/organizations/guid",
                        created_at: "2016-08-25T12:02:01Z",
                        updated_at: null
                      },
                      entity: {
                        name: "BRUI",
                        "billing_enabled": false,
                        "quota_definition_guid": "guid",
                        "status": "active",
                        "quota_definition_url": "/v2/quota_definitions/guid",
                        "spaces_url": "/v2/organizations/guid/spaces",
                        "domains_url": "/v2/organizations/guid/domains",
                        "private_domains_url": "/v2/organizations/guid/private_domains",
                        "users_url": "/v2/organizations/guid/users",
                        "managers_url": "/v2/organizations/guid/managers",
                        "billing_managers_url": "/v2/organizations/guid/billing_managers",
                        "auditors_url": "/v2/organizations/guid/auditors",
                        "app_events_url": "/v2/organizations/guid/app_events",
                        "space_quota_definitions_url": "/v2/organizations/guid/space_quota_definitions"
                      }
                    }
                  ]
                }
              }
            },
            is_not_manager: {
              response: {
                data: {
                  total_results: 0,
                  total_pages: 0,
                  prev_url: null,
                  next_url: null,
                  resources: []
                }
              }
            }
          }
        };
      },

      ListAllOrganizationsForUser: function (guid) {
        return {
          url: '/pp/v1/proxy/v2/users/' + guid + '/organizations?results-per-page=100',

          success: {
            code: 200,
            response: {
              data: {
                total_results: 1,
                total_pages: 1,
                prev_url: null,
                next_url: null,
                resources: [
                  {
                    metadata: {
                      guid: "guid",
                      url: "/v2/organizations/guid",
                      created_at: "2016-08-25T12:02:01Z",
                      updated_at: null
                    },
                    entity: {
                      name: "BRUI",
                      "billing_enabled": false,
                      "quota_definition_guid": "guid",
                      "status": "active",
                      "quota_definition_url": "/v2/quota_definitions/guid",
                      "spaces_url": "/v2/organizations/guid/spaces",
                      "domains_url": "/v2/organizations/guid/domains",
                      "private_domains_url": "/v2/organizations/guid/private_domains",
                      "users_url": "/v2/organizations/guid/users",
                      "managers_url": "/v2/organizations/guid/managers",
                      "billing_managers_url": "/v2/organizations/guid/billing_managers",
                      "auditors_url": "/v2/organizations/guid/auditors",
                      "app_events_url": "/v2/organizations/guid/app_events",
                      "space_quota_definitions_url": "/v2/organizations/guid/space_quota_definitions"
                    }
                  }
                ]
              }
            }
          }
        };
      }
      ,

      // Space
      ListAllAuditedSpacesForUser: function (guid) {
        return {
          url: '/pp/v1/proxy/v2/users/' + guid + '/audited_spaces?results-per-page=100',

          success: {
            response: {
              data: {
                total_results: 0,
                total_pages: 0,
                prev_url: null,
                next_url: null,
                resources: []
              }

            },
            code: 200
          }
        };
      }
      ,

      ListAllManagedSpacesForUser: function (guid) {
        return {
          url: '/pp/v1/proxy/v2/users/' + guid + '/managed_spaces?results-per-page=100',

          success: {
            code: 200,
            is_manager: {
              response: {
                data: {
                  total_results: 1,
                  total_pages: 1,
                  prev_url: null,
                  next_url: null,
                  resources: [
                    {
                      metadata: {
                        guid: "guid",
                        url: "/v2/spaces/guid",
                        created_at: "2016-09-02T15:46:50Z",
                        updated_at: null
                      },
                      entity: {
                        name: "mySpace3",
                        organization_guid: "guid",
                        space_quota_definition_guid: null,
                        allow_ssh: true,
                        organization_url: "/v2/organizations/guid",
                        developers_url: "/v2/spaces/guid/developers",
                        managers_url: "/v2/spaces/guid/managers",
                        auditors_url: "/v2/spaces/guid/auditors",
                        apps_url: "/v2/spaces/guid/apps",
                        routes_url: "/v2/spaces/guid/routes",
                        domains_url: "/v2/spaces/guid/domains",
                        service_instances_url: "/v2/spaces/guid/service_instances",
                        app_events_url: "/v2/spaces/guid/app_events",
                        events_url: "/v2/spaces/guid/events",
                        security_groups_url: "/v2/spaces/guid/security_groups"
                      }
                    }]
                }
              }
            },
            is_not_manager: {
              response: {
                data: {
                  total_results: 0,
                  total_pages: 0,
                  prev_url: null,
                  next_url: null,
                  resources: []
                }
              }
            }
          }
        };
      }
      ,

      ListAllSpacesForUser: function (guid) {
        return {
          url: '/pp/v1/proxy/v2/users/' + guid + '/spaces?results-per-page=100',

          success: {
            code: 200,
            is_developer: {
              response: {
                data: {
                  total_results: 1,
                  total_pages: 1,
                  prev_url: null,
                  next_url: null,
                  resources: [{
                    metadata: {
                      guid: "guid",
                      url: "/v2/spaces/guid",
                      created_at: "2016-09-02T15:46:50Z",
                      updated_at: null
                    },
                    entity: {
                      name: "mySpace3",
                      organization_guid: "guid",
                      space_quota_definition_guid: null,
                      allow_ssh: true,
                      organization_url: "/v2/organizations/guid",
                      developers_url: "/v2/spaces/guid/developers",
                      "managers_url": "/v2/spaces/guid/managers",
                      "auditors_url": "/v2/spaces/guid/auditors",
                      "apps_url": "/v2/spaces/guid/apps",
                      "routes_url": "/v2/spaces/guid/routes",
                      "domains_url": "/v2/spaces/guid/domains",
                      "service_instances_url": "/v2/spaces/guid/service_instances",
                      "app_events_url": "/v2/spaces/guid/app_events",
                      "events_url": "/v2/spaces/guid/events",
                      "security_groups_url": "/v2/spaces/guid/security_groups"
                    }
                  }]
                }
              }
            },
            is_not_developer: {
              response: {
                data: {
                  total_results: 0,
                  total_pages: 0,
                  prev_url: null,
                  next_url: null,
                  resources: []
                }
              }
            }
          }
        };
      }
      ,

      GetUserSummary: function (guid) {
        return {
          url: '/pp/v1/proxy/v2/users/' + guid + '/summary',

          success: {
            code: 200,
            response: {
              metadata: {
                guid: "a256c708-09cc-4650-ac7d-a44b291fe997",
                created_at: "2016-08-25T10:49:30Z",
                updated_at: null
              },
              entity: {
                organizations: [{
                  metadata: {
                    guid: "guid",
                    created_at: "2016-08-25T12:02:01Z",
                    updated_at: null
                  },
                  entity: {
                    name: "BRUI",
                    billing_enabled: false,
                    status: "active",
                    spaces: [{
                      metadata: {
                        guid: "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                        created_at: "2016-08-25T12:02:20Z",
                        updated_at: null
                      }, entity: {name: "mySpace"}
                    }, {
                      metadata: {
                        guid: "b694bcb4-a5d0-4139-8733-b2eebb611362",
                        created_at: "2016-09-02T15:46:48Z",
                        updated_at: null
                      }, entity: {name: "mySpace2"}
                    }, {
                      metadata: {
                        guid: "a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                        created_at: "2016-09-02T15:46:50Z",
                        updated_at: null
                      }, entity: {name: "mySpace3"}
                    }],
                    quota_definition: {
                      metadata: {
                        guid: "1c604341-685e-4ff2-9817-4d5ae24d5861",
                        created_at: "2016-08-25T10:48:19Z",
                        updated_at: null
                      },
                      entity: {
                        name: "default",
                        non_basic_services_allowed: true,
                        total_services: 100,
                        memory_limit: 10240,
                        trial_db_allowed: false,
                        total_routes: 1000,
                        instance_memory_limit: -1,
                        total_private_domains: -1,
                        app_instance_limit: -1,
                        app_task_limit: -1
                      }
                    },
                    managers: [{
                      metadata: {
                        guid: "a256c708-09cc-4650-ac7d-a44b291fe997",
                        created_at: "2016-08-25T10:49:30Z",
                        updated_at: null
                      }, entity: {admin: false, active: true, default_space_guid: null}
                    }]
                  }
                }],
                managed_organizations: [{
                  metadata: {
                    guid: "guid",
                    created_at: "2016-08-25T12:02:01Z",
                    updated_at: null
                  },
                  entity: {
                    name: "BRUI",
                    billing_enabled: false,
                    status: "active",
                    spaces: [{
                      metadata: {
                        guid: "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                        created_at: "2016-08-25T12:02:20Z",
                        updated_at: null
                      }, entity: {name: "mySpace"}
                    }, {
                      metadata: {
                        guid: "b694bcb4-a5d0-4139-8733-b2eebb611362",
                        created_at: "2016-09-02T15:46:48Z",
                        updated_at: null
                      }, entity: {name: "mySpace2"}
                    }, {
                      metadata: {
                        guid: "a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                        created_at: "2016-09-02T15:46:50Z",
                        updated_at: null
                      }, entity: {name: "mySpace3"}
                    }],
                    quota_definition: {
                      metadata: {
                        guid: "1c604341-685e-4ff2-9817-4d5ae24d5861",
                        created_at: "2016-08-25T10:48:19Z",
                        updated_at: null
                      },
                      entity: {
                        name: "default",
                        non_basic_services_allowed: true,
                        total_services: 100,
                        memory_limit: 10240,
                        trial_db_allowed: false,
                        total_routes: 1000,
                        instance_memory_limit: -1,
                        total_private_domains: -1,
                        app_instance_limit: -1,
                        app_task_limit: -1
                      }
                    },
                    managers: [{
                      metadata: {
                        guid: "a256c708-09cc-4650-ac7d-a44b291fe997",
                        created_at: "2016-08-25T10:49:30Z",
                        updated_at: null
                      }, entity: {admin: false, active: true, default_space_guid: null}
                    }]
                  }
                }],
                billing_managed_organizations: [],
                audited_organizations: [],
                spaces: [{
                  metadata: {
                    guid: "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                    created_at: "2016-08-25T12:02:20Z",
                    updated_at: null
                  }, entity: {name: "mySpace"}
                }, {
                  metadata: {
                    guid: "b694bcb4-a5d0-4139-8733-b2eebb611362",
                    created_at: "2016-09-02T15:46:48Z",
                    updated_at: null
                  }, entity: {name: "mySpace2"}
                }, {
                  metadata: {
                    guid: "a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                    created_at: "2016-09-02T15:46:50Z",
                    updated_at: null
                  }, entity: {name: "mySpace3"}
                }],
                managed_spaces: [{
                  metadata: {
                    guid: "89a370b9-9ba3-4cb4-8f2f-22933fba2990",
                    created_at: "2016-08-25T12:02:20Z",
                    updated_at: null
                  }, entity: {name: "mySpace"}
                }, {
                  metadata: {
                    guid: "b694bcb4-a5d0-4139-8733-b2eebb611362",
                    created_at: "2016-09-02T15:46:48Z",
                    updated_at: null
                  }, entity: {name: "mySpace2"}
                }, {
                  metadata: {
                    guid: "a149c86b-c0eb-4fa8-b1a9-1b0245e3f13a",
                    created_at: "2016-09-02T15:46:50Z",
                    updated_at: null
                  }, entity: {name: "mySpace3"}
                }],
                audited_spaces: []
              }
            }
          }
        };
      }

    }
    ;

    /* eslint-enable quote-props */
  })
(this.mock = this.mock || {});
