(function () {
  'use strict';

  describe('service instance API', function () {
    var $httpBackend, serviceInstanceApi;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var apiManager = $injector.get('app.api.apiManager');
      serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(serviceInstanceApi).toBeDefined();
    });

    it('should have `$http` property defined', function () {
      expect(serviceInstanceApi.$http).toBeDefined();
    });

    it('should send POST request for connect', function () {
      var data = {
        username: 'user',
        name: 'c1',
        service_user: 'c1_user',
        service_token: 'token',
        expires_at: 1000,
        scope: ['role1']
      };
      $httpBackend.expectPOST('/api/service-instances/connect', data).respond(200, '');
      serviceInstanceApi.connect('user', 'c1', 'c1_user', 'token', 1000, ['role1']);
      $httpBackend.flush();
    });

    it('should return service instances for specified user', function () {
      var data = {
        items: ['x','y','z']
      };
      $httpBackend.when('GET', '/api/service-instances?username=dev').respond(200, data);

      serviceInstanceApi.list('dev').then(function (response) {
        expect(response.data).toEqual({items: ['x','y','z']});
      });

      $httpBackend.flush();
    });

    it('should send POST request for register', function () {
      var data = {
        username: 'user',
        serviceInstances: ['service']
      };
      $httpBackend.expectPOST('/api/service-instances/register', data).respond(200, '');
      serviceInstanceApi.register('user', ['service']);
      $httpBackend.flush();
    });

    it('should send POST request for disconnect', function () {
      var data = {
        username: 'user',
        name: 'service'
      };
      $httpBackend.expectPOST('/api/service-instances/disconnect', data).respond(200, '');
      serviceInstanceApi.disconnect('user', 'service');
      $httpBackend.flush();
    });
  });

})();
