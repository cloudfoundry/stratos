(function () {
  'use strict';

  describe('service instance model', function () {
    var $httpBackend, serviceInstance, mockData;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var modelManager = $injector.get('app.model.modelManager');
      var account = modelManager.retrieve('app.model.account');
      account.data = { username: 'dev' };
      serviceInstance = modelManager.retrieve('app.model.serviceInstance');

      mockData = {
        items: [
          { name: 'cluster1', url:' cluster1_url' },
          { name: 'cluster2', url:' cluster2_url' }
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
      expect(serviceInstance.account).toBeDefined();
      expect(serviceInstance.serviceInstanceApi).toBeDefined();
      expect(serviceInstance.serviceInstances).toEqual([]);
      expect(serviceInstance.numRegistered).toBe(0);
    });

    it('should set `serviceInstances` on list()', function () {
      var expectedData = [
        { name: 'cluster1', url:' cluster1_url' },
        { name: 'cluster2', url:' cluster2_url' }
      ];

      $httpBackend.when('GET', '/api/service-instances?username=dev')
        .respond(200, mockData);

      serviceInstance.list().then(function (response) {
        expect(response).toEqual({ serviceInstances: expectedData, numRegistered: 0 });
        expect(serviceInstance.serviceInstances).toEqual(expectedData);
        expect(serviceInstance.numRegistered).toBe(0);
      });

      $httpBackend.flush();
    });

    it('should not set `serviceInstances` on list() and error', function () {
      $httpBackend.when('GET', '/api/service-instances?username=dev')
        .respond(403, {});

      serviceInstance.list().then(function () {}, function (error) {
        expect(error.status).toBe(403);
        expect(error.data).toEqual({});
        expect(serviceInstance.serviceInstances).toEqual([]);
        expect(serviceInstance.numRegistered).toBe(0);
      });

      $httpBackend.flush();
    });

    it('should POST correct data on register()', function () {
      var data = {
        username: 'dev',
        name: 'service',
        service_user: 'username',
        service_password: 'password'
      };
      $httpBackend.expectPOST('/api/service-instances/register', data).respond(200, '');

      serviceInstance.register('service', 'username', 'password');

      $httpBackend.flush();
    });

    it('should POST correct data on unregister()', function () {
      var data = {
        username: 'dev',
        name: 'service'
      };
      $httpBackend.expectPOST('/api/service-instances/unregister', data).respond(200, '');

      serviceInstance.unregister('service');

      $httpBackend.flush();
    });
  });

})();
