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
    beforeEach(module('green-box-console'));
    beforeEach(module(function ($exceptionHandlerProvider) {
      $exceptionHandlerProvider.mode('log');
    }));
    beforeEach(module({
      'helion.framework.widgets.asyncTaskDialog': function (content, context, actionTask) {
        return {
          content: content,
          context: context,
          actionTask: actionTask
        };
      }
    }));

    beforeEach(inject(function ($injector) {
      addRoutesFactory = $injector.get('cloud-foundry.view.applications.application.summary.addRoutes');
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');

      // Initialise model data
      var model = modelManager.retrieve('cloud-foundry.model.application');
      var availableDomains = [{name: 'test.com', guid: domainGuid}];
      _.set(model, 'application.summary.available_domains', availableDomains);
      _.set(model, 'application.summary.space_guid', spaceGuid);
    }));

    it('should be defined', function () {
      expect(true).toBe(false);
      expect(addRoutesFactory).toBeDefined();
    });

    it('should pass correct content spec to asyncTaskDialog', function () {
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
      modalObj.actionTask(data, dialog);
      $httpBackend.flush();
    });

  });
})();
