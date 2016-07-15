(function () {
  'use strict';

  describe('user service instance API', function () {
    var $httpBackend, $httpParamSerializer, serviceInstanceApi;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $httpParamSerializer = $injector.get('$httpParamSerializer');

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

    it('should have `$httpParamSerializer` property defined', function () {
      expect(serviceInstanceApi.$httpParamSerializer).toBeDefined();
    });

    it('should send POST request for create', function () {
      var data = { api_endpoint: 'url', cnsi_name: 'name' };
      $httpBackend.expectPOST('/pp/v1/register/hcf', $httpParamSerializer(data)).respond(200, '');
      serviceInstanceApi.create('url', 'name');
      $httpBackend.flush();
    });

    it('should send POST request for createHCE', function () {
      var data = { api_endpoint: 'url', cnsi_name: 'name' };
      $httpBackend.expectPOST('/pp/v1/register/hce', $httpParamSerializer(data)).respond(200, '');
      serviceInstanceApi.createHce('url', 'name');
      $httpBackend.flush();
    });

    it('should send POST request for remove', function () {
      var data = { cnsi_guid: 'cnsi_guid' };
      $httpBackend.expectPOST('/pp/v1/unregister', $httpParamSerializer(data)).respond(200, '');
      serviceInstanceApi.remove('cnsi_guid');
      $httpBackend.flush();
    });

    it('should return all CNSIs', function () {
      var data = ['x','y','z'];
      $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, data);

      serviceInstanceApi.list().then(function (response) {
        expect(response.data).toEqual(['x','y','z']);
      });

      $httpBackend.flush();
    });
  });

})();
