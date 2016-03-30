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
      $httpBackend.expectPOST('/api/service-instances/user/connect', { url: 'url' }).respond(200, '');
      serviceInstanceApi.connect('url');
      $httpBackend.flush();
    });

    it('should return service instances for specified user', function () {
      var data = {
        items: ['x','y','z']
      };
      $httpBackend.when('GET', '/api/service-instances/user').respond(200, data);

      serviceInstanceApi.list().then(function (response) {
        expect(response.data).toEqual({items: ['x','y','z']});
      });

      $httpBackend.flush();
    });

    it('should send POST request for register', function () {
      var data = {
        serviceInstances: ['url1', 'url2']
      };
      $httpBackend.expectPOST('/api/service-instances/user/register', data).respond(200, '');
      serviceInstanceApi.register(['url1', 'url2']);
      $httpBackend.flush();
    });

    it('should send POST request for disconnect', function () {
      $httpBackend.expectPOST('/api/service-instances/user/disconnect', { url: 'url' }).respond(200, '');
      serviceInstanceApi.disconnect('url');
      $httpBackend.flush();
    });
  });

})();
