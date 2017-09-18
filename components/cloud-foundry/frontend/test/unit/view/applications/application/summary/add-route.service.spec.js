(function () {
  'use strict';

  describe('Add-route service test', function () {
    var $httpBackend, addRoutesFactory;

    var spaceGuid = 'testSpace';
    var domainGuid = 'testDomain';
    var cnsiGuid = 'testCnsi';
    var applicationId = 'testApplicationId';
    var path = 'testpath';
    var mockAddRouteResponse = {
      metadata: {
        guid: 'testGuid'
      }
    };
    var mockErrorResponse = {
      error: {
        error_code: 'CF-RouteHostTaken'
      }
    };
    var data = {
      path: null,
      port: null,
      host: path,
      space_guid: spaceGuid,
      domain_guid: domainGuid
    };

    beforeEach(module('templates'));
    beforeEach(module('console-app'));
    beforeEach(module(function ($exceptionHandlerProvider) {
      $exceptionHandlerProvider.mode('log');
    }));
    beforeEach(module({
      frameworkAsyncTaskDialog: function (content, context, actionTask) {
        return {
          content: content,
          context: context,
          actionTask: actionTask
        };
      }
    }));

    beforeEach(inject(function ($injector) {
      addRoutesFactory = $injector.get('cfAddRoutes');
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('modelManager');

      // Initialise model data
      var model = modelManager.retrieve('cloud-foundry.model.application');
      var availableDomains = [{name: 'test.com', guid: domainGuid}];
      _.set(model, 'application.summary.available_domains', availableDomains);
      _.set(model, 'application.summary.space_guid', spaceGuid);
    }));

    it('should be defined', function () {
      expect(addRoutesFactory).toBeDefined();
    });

    it('should pass correct content spec to frameworkAsyncTaskDialog', function () {
      var modalObj = addRoutesFactory.add(cnsiGuid, applicationId);
      expect(modalObj.content.title).toBeDefined();
      expect(modalObj.content.templateUrl).toBeDefined();
      expect(modalObj.content.buttonTitles.submit).toBeDefined();
    });

    it('should have `domain_guid`, `space_guid` set to appropriate values', function () {
      var modalObj = addRoutesFactory.add(cnsiGuid, applicationId);
      expect(modalObj.context.data.space_guid).toEqual(spaceGuid);
      expect(modalObj.context.data.domain_guid).toEqual(domainGuid);
    });

    it('should successfully add a route', function () {

      var expectedPostReq = {
        domain_guid: domainGuid,
        host: path,
        space_guid: spaceGuid
      };

      var modalObj = addRoutesFactory.add(cnsiGuid, applicationId);

      $httpBackend.expectGET('/pp/v1/proxy/v2/shared_domains?results-per-page=100').respond(200, {resources: []});
      $httpBackend.expectPOST('/pp/v1/proxy/v2/routes', expectedPostReq).respond(200, mockAddRouteResponse);
      $httpBackend.expectPUT('/pp/v1/proxy/v2/routes/testGuid/apps/testApplicationId').respond(200, {});
      $httpBackend.expectGET('/pp/v1/proxy/v2/apps/' + applicationId + '/summary').respond(200, {});

      var dialog = {
        context: {
          options: {
            domainMap: {}
          }
        }
      };
      data.activeTab = 0;
      modalObj.actionTask(data, dialog);
      expect(modalObj.context.routeExists()).toBe(false);
      $httpBackend.flush();
    });

    it('should raise appropriate error on duplicate route', function () {

      var expectedPostReq = {
        domain_guid: domainGuid,
        host: path,
        space_guid: spaceGuid
      };

      var modalObj = addRoutesFactory.add(cnsiGuid, applicationId);

      $httpBackend.expectGET('/pp/v1/proxy/v2/shared_domains?results-per-page=100').respond(200, {resources: []});
      $httpBackend.whenPOST('/pp/v1/proxy/v2/routes', expectedPostReq).respond(200, {data: mockErrorResponse});

      var dialog = {
        context: {
          options: {
            domainMap: {}
          }
        }
      };

      modalObj.actionTask(data, dialog).catch(function (err) {
        expect(err.data.error).toEqual(mockErrorResponse.error);
      });

      // expect(modalObj.actionTask(data, dialog)).toThrow();
      $httpBackend.flush();
    });

    it('should successfully add a tcp route', function () {

      var expectedPostReq = {
        metadata: {
          guid: 'guid'
        },
        entity: {
          domain_guid: domainGuid,
          host: path,
          space_guid: spaceGuid,
          port: 4000
        }
      };

      var domains = [{
        metadata: {
          guid: 'testDomain',
          type: 'tcp'
        },
        entity: {
          router_group_tupe: 'http'
        }
      }];

      var modalObj = addRoutesFactory.add(cnsiGuid, applicationId);

      $httpBackend.expectPOST('/pp/v1/proxy/v2/routes?generate_port=true').respond(200, expectedPostReq);

      $httpBackend.whenGET('/pp/v1/proxy/v2/shared_domains?results-per-page=100').respond(200, {resources: domains});
      $httpBackend.whenPUT('/pp/v1/proxy/v2/routes/guid/apps/testApplicationId').respond(200, {});
      $httpBackend.whenGET('/pp/v1/proxy/v2/apps/' + applicationId + '/summary').respond(200, {});

      var dialog = {
        context: {
          options: {
            domainMap: {
              testDomain: {
                type: 'tcp'
              }
            }
          }
        }
      };

      data.useRandomPort = true;
      data.activeTab = 0;
      modalObj.actionTask(data, dialog);
      $httpBackend.flush();
    });

    it('should successfully add an existing route', function () {

      var routesRequestUrl = '/pp/v1/proxy/v2/spaces/' +
          spaceGuid +
          '/routes?include-relations=domain,apps&inline-relations-depth=1&results-per-page=100';

      var expectedRoutesRes = {
        total_results: 17,
        total_pages: 1,
        prev_url: null,
        next_url: null,
        resources: [
          {
            metadata: {
              guid: 'ec16268e-2372-4b91-a704-8c49bdf5f052',
              url: '/v2/routes/ec16268e-2372-4b91-a704-8c49bdf5f052',
              created_at: '2017-06-02T09:03:22Z',
              updated_at: '2017-06-02T09:03:22Z'
            },
            entity: {
              host: 'console',
              path: '',
              domain_guid: '9cacc81a-8a58-4404-835c-43baf41b9833',
              space_guid: 'ccd7f508-5aab-4811-b555-a954f8205bba',
              service_instance_guid: null,
              port: null,
              domain_url: '/v2/shared_domains/9cacc81a-8a58-4404-835c-43baf41b9833',
              domain: {
                metadata: {
                  guid: '9cacc81a-8a58-4404-835c-43baf41b9833',
                  url: '/v2/shared_domains/9cacc81a-8a58-4404-835c-43baf41b9833',
                  created_at: '2017-06-01T10:15:44Z',
                  updated_at: '2017-06-01T10:15:44Z'
                },
                entity: {
                  name: 'cf-dev.io',
                  router_group_guid: null,
                  router_group_type: null
                }
              },
              space_url: '/v2/spaces/ccd7f508-5aab-4811-b555-a954f8205bba',
              apps_url: '/v2/routes/ec16268e-2372-4b91-a704-8c49bdf5f052/apps',
              apps: [
                {
                  metadata: {
                    guid: '25906311-e793-4661-8507-280461bce9c7',
                    url: '/v2/apps/25906311-e793-4661-8507-280461bce9c7',
                    created_at: '2017-06-26T08:31:03Z',
                    updated_at: '2017-08-16T14:19:34Z'
                  },
                  entity: {
                    name: 'node-env',
                    production: false,
                    space_guid: 'ccd7f508-5aab-4811-b555-a954f8205bba',
                    stack_guid: 'fe6a3b2c-6e5a-4f16-91f8-60d6c6fcde8d',
                    buildpack: 'binary_buildpack',
                    detected_buildpack: '',
                    detected_buildpack_guid: '7d7836d9-aad7-46d4-b19e-9f60542438d8',
                    environment_json: {},
                    memory: 16,
                    instances: 1,
                    disk_quota: 16,
                    state: 'STARTED',
                    version: '628ddb0d-6e59-4ce4-998a-26ad412b4727',
                    command: null,
                    console: false,
                    debug: null,
                    staging_task_id: 'f6c8a623-47ae-40c6-99a0-2571954963d3',
                    package_state: 'STAGED',
                    health_check_type: 'process',
                    health_check_timeout: null,
                    health_check_http_endpoint: null,
                    staging_failed_reason: null,
                    staging_failed_description: null,
                    diego: true,
                    docker_image: null,
                    package_updated_at: '2017-06-26T08:38:22Z',
                    detected_start_command: './go-env',
                    enable_ssh: true,
                    docker_credentials_json: {
                      redacted_message: '[PRIVATE DATA HIDDEN]'
                    },
                    ports: [
                      8080
                    ],
                    space_url: '/v2/spaces/ccd7f508-5aab-4811-b555-a954f8205bba',
                    stack_url: '/v2/stacks/fe6a3b2c-6e5a-4f16-91f8-60d6c6fcde8d',
                    routes_url: '/v2/apps/25906311-e793-4661-8507-280461bce9c7/routes',
                    events_url: '/v2/apps/25906311-e793-4661-8507-280461bce9c7/events',
                    service_bindings_url: '/v2/apps/25906311-e793-4661-8507-280461bce9c7/service_bindings',
                    route_mappings_url: '/v2/apps/25906311-e793-4661-8507-280461bce9c7/route_mappings'
                  }
                }
              ],
              route_mappings_url: '/v2/routes/ec16268e-2372-4b91-a704-8c49bdf5f052/route_mappings'
            }
          }
        ]
      };

      var domains = [{
        metadata: {
          guid: 'testDomain',
          type: 'tcp'
        },
        entity: {
          router_group_tupe: 'http'
        }
      }];

      var forbiddenCallTriggered = false;
      var modalObj = addRoutesFactory.add(cnsiGuid, applicationId);

      $httpBackend.expectGET(routesRequestUrl).respond(200, expectedRoutesRes);
      $httpBackend.when('/pp/v1/proxy/v2/routes?generate_port=true').respond(function () {
        forbiddenCallTriggered = true;
        return [400, ''];
      });

      $httpBackend.whenGET('/pp/v1/proxy/v2/shared_domains?results-per-page=100').respond(200, {resources: domains});
      $httpBackend.whenPUT('/pp/v1/proxy/v2/routes/guid/apps/testApplicationId').respond(200, {});
      $httpBackend.whenGET('/pp/v1/proxy/v2/apps/' + applicationId + '/summary').respond(200, {});

      var dialog = {
        context: {
          options: {
            domainMap: {
              testDomain: {
                type: 'tcp'
              }
            }
          }
        }
      };

      data.useRandomPort = true;
      data.activeTab = 0;
      modalObj.actionTask(data, dialog);
      $httpBackend.flush();
      expect(forbiddenCallTriggered).toBe(false);
    });

  });
})();
