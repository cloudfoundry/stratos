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
        name: 'service',
        service_user: 'username',
        service_password: 'password'
      };
      $httpBackend.expectPOST('/api/service-instances/register', data).respond(200, '');
      serviceInstanceApi.register('user', 'service', 'username', 'password');
      $httpBackend.flush();
    });

    it('should send POST request for unregister', function () {
      var data = {
        username: 'user',
        name: 'service'
      };
      $httpBackend.expectPOST('/api/service-instances/unregister', data).respond(200, '');
      serviceInstanceApi.unregister('user', 'service');
      $httpBackend.flush();
    });
  });

})();
