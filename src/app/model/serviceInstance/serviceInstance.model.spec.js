(function () {
  'use strict';

  describe('service instance model', function () {
    var $httpBackend, $httpParamSerializer, serviceInstance, mockData;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $httpParamSerializer = $injector.get('$httpParamSerializer');

      var modelManager = $injector.get('app.model.modelManager');
      serviceInstance = modelManager.retrieve('app.model.serviceInstance');

      mockData = [
        { id: 1, name: 'cluster1', url:' cluster1_url', cnsi_type: 'hcf' },
        { id: 2, name: 'cluster2', url:' cluster2_url', cnsi_type: 'hce' }
      ];
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(serviceInstance).toBeDefined();
    });

    it('should have initial properties defined', function () {
      expect(serviceInstance.apiManager).toBeDefined();
      expect(serviceInstance.serviceInstances).toEqual([]);
    });

    it('should POST correct data on create()', function () {
      var response = { cnsi_type: 'hcf', api_endpoint: 'url', name: 'name' };
      var data = { api_endpoint: 'url', cnsi_name: 'name' };
      $httpBackend.expectPOST('/pp/v1/register/hcf', $httpParamSerializer(data)).respond(200, response);
      serviceInstance.create('url', 'name')
        .then(function () {
          var serviceInstances = serviceInstance.serviceInstances;
          expect(serviceInstances.length).toBe(1);
        });
      $httpBackend.flush();
    });

    it('should POST correct service instance on remove()', function () {
      var data = { cnsi_guid: 'cnsi_guid' };
      $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, {});
      $httpBackend.expectPOST('/pp/v1/unregister', $httpParamSerializer(data)).respond(200, {});
      serviceInstance.remove({ guid: 'cnsi_guid' });
      $httpBackend.flush();
    });

    it('should set `serviceInstances` on list()', function () {
      var expectedData = [
        { id: 1, name: 'cluster1', url:' cluster1_url', cnsi_type: 'hcf' },
        { id: 2, name: 'cluster2', url:' cluster2_url', cnsi_type: 'hce' }
      ];

      $httpBackend.when('GET', '/pp/v1/cnsis')
        .respond(200, mockData);

      serviceInstance.list().then(function (response) {
        expect(serviceInstance.serviceInstances).toEqual(expectedData);
        expect(response.numAvailable).toBe(1);
      });

      $httpBackend.flush();
    });

    it('should set `serviceInstances` to [] on list() and no items returned', function () {
      $httpBackend.when('GET', '/pp/v1/cnsis').respond(200, {});

      serviceInstance.list().then(function () {
        expect(serviceInstance.serviceInstances).toEqual([]);
      });

      $httpBackend.flush();
    });

    it('should not set `serviceInstances` on list() and error', function () {
      $httpBackend.when('GET', '/pp/v1/cnsis')
        .respond(403, {});

      serviceInstance.list().then(function () {}, function (error) {
        expect(error.status).toBe(403);
        expect(error.data).toEqual({});
        expect(serviceInstance.serviceInstances).toEqual([]);
      });

      $httpBackend.flush();
    });
  });

})();
