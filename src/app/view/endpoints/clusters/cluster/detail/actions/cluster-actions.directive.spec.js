(function () {
  'use strict';

  fdescribe('cluster-actions directive', function () {
    var $compile, $scope, element, clusterActionsCtrl, $httpBackend, modelManager;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module({
      $state: {
        current: {
          name: 'test'
        },
        get: function () {
          return {
            data: {
              initialized: false
            }
          };
        }
      }
    }));
    beforeEach(module({
        $stateParams: {
          guid: 'guid'
        }
      })
    );

    beforeEach(inject(function ($injector) {
      $compile = $injector.get('$compile');
      $scope = $injector.get('$rootScope').$new();
      modelManager = $injector.get('app.model.modelManager');
    }));

    _.each(['admin', 'org_manager', 'space_manager', 'space_developer'], function (type) {

      var authModel, permissions;

      function setupStackatoInfo(isAdmin) {
        var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
        stackatoInfo.info = {
          endpoints: {
            hcf: {
              guid: {
                guid: 'guid',
                name: 'myHCF',
                version: '',
                user: {guid: '0c97cd5a-8ef8-4f80-af46-acfa8697824e', name: 'test', admin: isAdmin},
                type: ''
              }
            }
          }
        };
      }

      function setupFeatureFlagsRequest() {
        $httpBackend.whenGET('/pp/v1/proxy/v2/users/0c97cd5a-8ef8-4f80-af46-acfa8697824e/summary').respond(200, {
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
        });
      }

      function setupSummary() {
        $httpBackend.whenGET('/pp/v1/proxy/v2/config/feature_flags').respond(200, [
          {
            name: 'user_org_creation',
            enabled: false,
            error_message: null,
            url: '/v2/config/feature_flags/user_org_creation'
          },
          {
            name: 'route_creation',
            enabled: true,
            error_message: null,
            url: '/v2/config/feature_flags/route_creation'
          },
          {
            name: 'service_instance_creation',
            enabled: true,
            error_message: null,
            url: '/v2/config/feature_flags/service_instance_creation'
          }
        ]);
      }

      function setupOrganizations(isOrgManager) {
        $httpBackend.whenGET('/pp/v1/proxy/v2/users/0c97cd5a-8ef8-4f80-af46-acfa8697824e/audited_organizations?results-per-page=100')
          .respond(200, {
            total_results: 0,
            total_pages: 0,
            prev_url: null,
            next_url: null,
            resources: []
          });

        $httpBackend.whenGET('/pp/v1/proxy/v2/users/0c97cd5a-8ef8-4f80-af46-acfa8697824e/billing_managed_organizations?results-per-page=100')
          .respond(200, {
            total_results: 0,
            total_pages: 0,
            prev_url: null,
            next_url: null,
            resources: []
          });

        $httpBackend.whenGET('/pp/v1/proxy/v2/users/0c97cd5a-8ef8-4f80-af46-acfa8697824e/managed_organizations?results-per-page=100')
          .respond(200, {
            total_results: isOrgManager ? 1 : 0,
            total_pages: isOrgManager ? 1 : 0,
            prev_url: null,
            next_url: null,
            resources: isOrgManager ? [{
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
            }] : []
          });

        $httpBackend.whenGET('/pp/v1/proxy/v2/users/0c97cd5a-8ef8-4f80-af46-acfa8697824e/organizations?results-per-page=100')
          .respond(200, {
            total_results: 1,
            total_pages: 1,
            prev_url: null,
            next_url: null,
            resources: [{
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
            }]
          });
      }

      function setupSpaces(isSpaceManager, isSpaceDeveloper) {
        $httpBackend.whenGET('/pp/v1/proxy/v2/users/0c97cd5a-8ef8-4f80-af46-acfa8697824e/audited_spaces?results-per-page=100')
          .respond(200, {
            total_results: 0,
            total_pages: 0,
            prev_url: null,
            next_url: null,
            resources: []
          });
        $httpBackend.whenGET('/pp/v1/proxy/v2/users/0c97cd5a-8ef8-4f80-af46-acfa8697824e/managed_spaces?results-per-page=100')
          .respond(200, {
            total_results: isSpaceManager ? 1 : 0,
            total_pages: isSpaceManager ? 1 : 0,
            prev_url: null,
            next_url: null,
            resources: isSpaceManager ? [{
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
            }] : []
          });

        $httpBackend.whenGET('/pp/v1/proxy/v2/users/0c97cd5a-8ef8-4f80-af46-acfa8697824e/spaces?results-per-page=100')
          .respond(200, {
            total_results: isSpaceDeveloper ? 1 : 0,
            total_pages: isSpaceDeveloper ? 1 : 0,
            prev_url: null,
            next_url: null,
            resources: [{
              total_results: 1,
              total_pages: 1,
              prev_url: null,
              next_url: null,
              resources: isSpaceDeveloper ? [
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
                    allow_ssh: true
                  }
                }
              ] : []
            }]
          });
      }

      function initAuthModel(type, $injector) {

        var permissions = {
          create_organisation: false,
          create_space: false,
          assign_users: false
        };

        var isAdmin = false;
        var isOrgManager = false;
        var isSpaceManager = true;
        var isSpaceDeveloper = true;
        if (type === 'admin' || type === 'org_manager') {
          permissions.create_organisation = true;
          permissions.create_space = true;
          permissions.assign_users = true;
          isAdmin = type === 'admin';
          isOrgManager = type === 'org_manager';
        } else if (type === 'space_manager') {
          permissions.create_organisation = false;
          permissions.create_space = true;
          permissions.assign_users = true;
          isSpaceManager = true;
        } else {
          permissions.create_organisation = false;
          permissions.create_space = false;
          permissions.assign_users = false;
          isSpaceDeveloper = true;
        }
        $httpBackend = $injector.get('$httpBackend');
        setupStackatoInfo(isAdmin);
        setupFeatureFlagsRequest();
        if (isAdmin) {
          setupSummary();
        } else {
          setupOrganizations(isOrgManager);
          setupSpaces(isSpaceManager, isSpaceDeveloper);
        }
        setupOrganizations(isOrgManager);
        setupSpaces(isSpaceManager, isSpaceDeveloper);

        var authModel = modelManager.retrieve('cloud-foundry.model.auth');
        authModel.initialize();
        $httpBackend.flush();

        var markup = '<cluster-actions></cluster-actions>';
        element = angular.element(markup);
        $compile(element)($scope);
        $scope.$apply();
        clusterActionsCtrl = element.controller('clusterActions');

        return permissions;
      }

      describe(type + ' user', function () {

        beforeEach(inject(function ($injector) {
          initAuthModel(type, $injector);
        }));


        it('should have create organisation in correct state', function () {
          // TODO if create organisation is enabled for user
          expect(true).toEqual(true);
          expect(true).toEqual(true);
        });

        it('should have create space in correct state ', function () {

          // TODO if create space is enabled for user

        });

        if (type !== 'admin') {
          it('should have create space in correct state for org manager ', function () {
            // TODO check if create space is disabled for non-org manager

          });
        }

        it('should have assign users in correct state', function () {
          // TODO check if assign users is in correct state.. should be abled for org manager, and space manager
          expect(true).toEqual(true);

        });
      });
    });

  })
  ;

})
();
