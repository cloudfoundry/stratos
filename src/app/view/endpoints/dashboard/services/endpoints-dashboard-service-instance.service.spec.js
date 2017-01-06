/* eslint-disable angular/json-functions */
(function () {
  'use strict';

  describe('endpoint dashboard tests', function () {
    var $httpBackend, service, modelManager;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module('app.view.endpoints.dashboard'));

    beforeEach(inject(function ($injector) {
      var utils = $injector.get('app.utils.utilsService');
      utils.getOemConfiguration = function () {
        return {
          CLOUD_FOUNDRY: 'Cloud Foundry',
          CODE_ENGINE: 'Helion Code Engine'
        };
      };
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    var validService = {
      api_endpoint: {
        Scheme: 'http',
        Host: 'api.foo.com'
      },
      cnsi_type: 'hcf',
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
      cnsi_type: 'hcf',
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
      cnsi_type: 'hcf',
      guid: '3',
      name: 'c3',
      token_expiry: 1
    };
    var expiredServicesEndpoint = {
      key: 'cnsi_3',
      name: 'c3',
      type: 'Cloud Foundry'
    };
    var hceService = {
      api_endpoint: {
        Scheme: 'http',
        Host: 'api.foo.com'
      },
      cnsi_type: 'hce',
      guid: '4',
      name: 'c4',
      valid: true,
      token_expiry: Number.MAX_VALUE
    };
    var hceServicesEndpoint = {
      key: 'cnsi_4',
      name: 'c4',
      type: 'Helion Code Engine'
    };

    function createController($injector) {
      $httpBackend = $injector.get('$httpBackend');
      service = $injector.get('app.view.endpoints.dashboard.cnsiService');
      modelManager = $injector.get('app.model.modelManager');
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
          $httpBackend.expectGET('/pp/v1/stackato/info').respond(200, {});
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
          $httpBackend.expectGET('/pp/v1/stackato/info').respond(500);
          service.updateInstances().then(function () {
            fail('Failed calls should not result in succeeded promise');
          });
          $httpBackend.flush();
        });
      });

      describe('updateInstancesCache', function () {
        it('empty cache', function () {
          var services = [validService, invalidService, expiredService, hceService];
          var endpoints = [validServicesEndpoint, invalidServicesEndpoint, expiredServicesEndpoint, hceServicesEndpoint];
          var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
          serviceInstanceModel.serviceInstances = services;
          var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
          userServiceInstanceModel.serviceInstances = _.keyBy(services, 'guid');

          var result = [];
          service.updateInstancesCache(result);

          expect(result.length).toBe(4);
          for (var i = 0; i < endpoints.length; i++) {
            if (!_.some(result, endpoints[i])) {
              fail('Could not find endpoint with values: ' + JSON.stringify(endpoints[i]));
            }
          }

        });

        it('existing cache', function () {
          var services = [validService, invalidService, expiredService, hceService];
          var endpoints = [validServicesEndpoint, invalidServicesEndpoint, expiredServicesEndpoint, hceServicesEndpoint];
          var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
          serviceInstanceModel.serviceInstances = services;
          var userServiceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
          userServiceInstanceModel.serviceInstances = _.keyBy(services, 'guid');

          var result = [{
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
          service.updateInstancesCache(result);

          expect(result.length).toBe(5);
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
