(function () {
  'use strict';

  describe('user service instance API', function () {
    var $httpBackend, userServiceInstanceApi;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var apiManager = $injector.get('app.api.apiManager');
      userServiceInstanceApi = apiManager.retrieve('app.api.serviceInstance.user');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(userServiceInstanceApi).toBeDefined();
    });

    it('should have `$http` property defined', function () {
      expect(userServiceInstanceApi.$http).toBeDefined();
    });

    it('should send POST request for connect', function () {
      $httpBackend.expectPOST('/api/service-instances/user/connect', { url: 'url' }).respond(200, '');
      userServiceInstanceApi.connect('url');
      $httpBackend.flush();
    });

    it('should return service instances for specified user', function () {
      var data = {
        items: ['x','y','z']
      };
      $httpBackend.when('GET', '/api/service-instances/user').respond(200, data);

      userServiceInstanceApi.list().then(function (response) {
        expect(response.data).toEqual({items: ['x','y','z']});
      });

      $httpBackend.flush();
    });

    it('should send POST request for register', function () {
      var data = {
        serviceInstances: ['url1', 'url2']
      };
      $httpBackend.expectPOST('/api/service-instances/user/register', data).respond(200, '');
      userServiceInstanceApi.register(['url1', 'url2']);
      $httpBackend.flush();
    });

    it('should send POST request for disconnect', function () {
      $httpBackend.expectDELETE('/api/service-instances/user/1').respond(200, '');
      userServiceInstanceApi.disconnect(1);
      $httpBackend.flush();
    });
  });

})();
