(function () {
  'use strict';

  describe('service instance model', function () {
    var $httpBackend, serviceInstance, mockData;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var modelManager = $injector.get('app.model.modelManager');
      serviceInstance = modelManager.retrieve('app.model.serviceInstance');

      mockData = {
        items: [
          { id: 1, name: 'cluster1', url:' cluster1_url' },
          { id: 2, name: 'cluster2', url:' cluster2_url' }
        ]
      };
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

    it('should set `serviceInstances` on list()', function () {
      var expectedData = [
        { id: 1, name: 'cluster1', url:' cluster1_url' },
        { id: 2, name: 'cluster2', url:' cluster2_url' }
      ];

      $httpBackend.when('GET', '/api/service-instances')
        .respond(200, mockData);

      serviceInstance.list().then(function () {
        expect(serviceInstance.serviceInstances).toEqual(expectedData);
      });

      $httpBackend.flush();
    });

    it('should not set `serviceInstances` on list() and error', function () {
      $httpBackend.when('GET', '/api/service-instances')
        .respond(403, {});

      serviceInstance.list().then(function () {}, function (error) {
        expect(error.status).toBe(403);
        expect(error.data).toEqual({});
        expect(serviceInstance.serviceInstances).toEqual([]);
      });

      $httpBackend.flush();
    });

    it('should POST correct data on create()', function () {
      var mockRespondData = { id: 1, url: 'url', name: 'name' };
      $httpBackend.expectPOST('/api/service-instances', { url: 'url', name: 'name' })
        .respond(200, mockRespondData);
      serviceInstance.create('url', 'name')
        .then(function (response) {
          expect(response.data).toEqual({ id: 1, url: 'url', name: 'name' });
        });
      $httpBackend.flush();
    });

    it('should DELETE correct service instance on remove()', function () {
      $httpBackend.expectDELETE('/api/service-instances/1').respond(200, '');
      serviceInstance.remove(1);
      $httpBackend.flush();
    });
  });

})();
