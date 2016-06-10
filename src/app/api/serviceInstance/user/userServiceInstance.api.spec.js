(function () {
  'use strict';

  describe('user service instance API', function () {
    var $httpBackend, $httpParamSerializer, userServiceInstanceApi;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $httpParamSerializer = $injector.get('$httpParamSerializer');

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

    it('should have `$httpParamSerializer` property defined', function () {
      expect(userServiceInstanceApi.$httpParamSerializer).toBeDefined();
    });

    it('should send POST request for connect', function () {
      var data = {
        cnsi_guid: 'cnsi_guid',
        username: 'username',
        password: 'password'
      };
      $httpBackend.expectPOST('/pp/v1/auth/login/cnsi', $httpParamSerializer(data)).respond(200, {});
      userServiceInstanceApi.connect('cnsi_guid', 'username', 'password');
      $httpBackend.flush();
    });

    it('should send POST request for disconnect', function () {
      var data = { cnsi_guid: 'cnsi_guid' };
      $httpBackend.expectPOST('/pp/v1/auth/logout/cnsi', $httpParamSerializer(data)).respond(200, '');
      userServiceInstanceApi.disconnect('cnsi_guid');
      $httpBackend.flush();
    });

    it('should send GET request and return CNSIs', function () {
      var data = ['x','y','z'];
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, data);

      userServiceInstanceApi.list().then(function (response) {
        expect(response.data).toEqual(['x','y','z']);
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
  });

})();
