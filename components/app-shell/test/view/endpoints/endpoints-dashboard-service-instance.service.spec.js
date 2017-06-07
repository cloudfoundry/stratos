/* eslint-disable angular/json-functions */
(function () {
  'use strict';

  describe('endpoint dashboard tests', function () {
    var $httpBackend, service, modelManager, appEndpointsDashboardService;

    beforeEach(module('templates'));
    beforeEach(module('console-app'));
    beforeEach(module('app.view.endpoints'));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    var validService = {
      api_endpoint: {
        Scheme: 'http',
        Host: 'api.foo.com'
      },
      cnsi_type: 'cf',
      guid: '1',
      name: 'c1',
      valid: true,
      token_expiry: Number.MAX_VALUE
    };
    var validServicesEndpoint = {
      key: 'cnsi_1',
      name: 'c1',
      type: 'Cloud Foundry'
    };
    var invalidService = {
      api_endpoint: {
        Scheme: 'http',
        Host: 'api.foo.com'
      },
      cnsi_type: 'cf',
      guid: '2',
      name: 'c2',
      token_expiry: Number.MAX_VALUE,
      error: true
    };
    var invalidServicesEndpoint = {
      key: 'cnsi_2',
      name: 'c2',
      type: 'Cloud Foundry'
    };
    var expiredService = {
      api_endpoint: {
        Scheme: 'http',
        Host: 'api.foo.com'
      },
      cnsi_type: 'cf',
      guid: '3',
      name: 'c3',
      token_expiry: 1
    };
    var expiredServicesEndpoint = {
      key: 'cnsi_3',
      name: 'c3',
      type: 'Cloud Foundry'
    };

    function createController($injector) {
      $httpBackend = $injector.get('$httpBackend');
      service = $injector.get('appEndpointsCnsiService');
      modelManager = $injector.get('modelManager');
      appEndpointsDashboardService = $injector.get('appEndpointsDashboardService');
    }

    describe('controller tests', function () {

      beforeEach(inject(function ($injector) {
        createController($injector, true);
      }));

      describe('haveInstances', function () {

        it('has instances', function () {
          var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
          serviceInstanceModel.serviceInstances = [ 'a' ];
          expect(service.haveInstances()).toBeTruthy();
        });

        it('has no instances', function () {
          expect(service.haveInstances()).toBeFalsy();
        });
      });

      describe('updateInstances', function () {

        it('succeeds', function () {
          $httpBackend.expectGET('/pp/v1/cnsis').respond(200, {});
          $httpBackend.expectGET('/pp/v1/cnsis/registered').respond(200, {});
          $httpBackend.expectGET('/pp/v1/info').respond(200, {});
          $httpBackend.expectGET('/pp/v1/cnsis/registered').respond(200, {});
          service.updateInstances()
            .then(function () {

            })
            .catch(function (error) {
              fail('Successful call should not result in failed promise. Error: ', error);
            });
          $httpBackend.flush();
        });

        it('fails', function () {
          $httpBackend.expectGET('/pp/v1/cnsis').respond(200, {});
          $httpBackend.expectGET('/pp/v1/cnsis/registered').respond(200, {});
          $httpBackend.expectGET('/pp/v1/info').respond(500);
          $httpBackend.expectGET('/pp/v1/cnsis/registered').respond(200, {});
          service.updateInstances().then(function () {
            fail('Failed calls should not result in succeeded promise');
          });
          $httpBackend.flush();
        });
      });

      describe('createEndpointEntries', function () {
        it('empty cache', function () {
          var services = [validService, invalidService, expiredService];
          var endpoints = [validServicesEndpoint, invalidServicesEndpoint, expiredServicesEndpoint];
          var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
          serviceInstanceModel.serviceInstances = services;
          var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
          userServiceInstanceModel.serviceInstances = _.keyBy(services, 'guid');

          service.createEndpointEntries();

          var result = appEndpointsDashboardService.endpoints;
          expect(result.length).toBe(3);
          for (var i = 0; i < endpoints.length; i++) {
            if (!_.some(result, endpoints[i])) {
              fail('Could not find endpoint with values: ' + JSON.stringify(endpoints[i]));
            }
          }

        });

        it('existing cache', function () {
          var services = [validService, invalidService, expiredService];
          var endpoints = [validServicesEndpoint, invalidServicesEndpoint, expiredServicesEndpoint];
          var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
          serviceInstanceModel.serviceInstances = services;
          var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
          userServiceInstanceModel.serviceInstances = _.keyBy(services, 'guid');

          appEndpointsDashboardService.endpoints = [{
            key: 'cnsi_1',
            guid: '1',
            valid: true,
            type: 'Cloud Foundry',
            token_expiry: Number.MAX_VALUE
          }, {
            key: 'cnsi_2',
            guid: '2',
            valid: true,
            type: 'Cloud Foundry',
            token_expiry: Number.MAX_VALUE
          }, {
            key: 'somethingElse-guid',
            guid: 'guid',
            valid: true,
            type: 'Cloud Foundry',
            token_expiry: Number.MAX_VALUE
          }];
          service.createEndpointEntries();

          var result = appEndpointsDashboardService.endpoints;
          expect(result.length).toBe(4);
          for (var i = 0; i < endpoints.length; i++) {
            if (!_.some(result, endpoints[i])) {
              fail('Could not find endpoint with values: ' + JSON.stringify(endpoints[i]));
            }
          }
        });
      });

    });

  });

})();
