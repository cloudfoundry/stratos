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
        expect(response).toEqual({ serviceInstances: expectedData, numCompleted: 0, numRegistered: 0 });
        expect(serviceInstance.serviceInstances).toEqual(expectedData);
        expect(serviceInstance.numRegistered).toBe(0);
      });

      $httpBackend.flush();
    });

    it('should set valid === true for service instance if not expired', function () {
      var data = {
        items: [
          { name: 'cluster1', url:' cluster1_url', expires_at: (new Date()).getTime() + 36000 },
          { name: 'cluster2', url:' cluster2_url' }
        ]
      };

      $httpBackend.when('GET', '/api/service-instances?username=dev')
        .respond(200, data);

      serviceInstance.list().then(function (response) {
        expect(response.numRegistered).toBe(1);
        expect(serviceInstance.serviceInstances[0].valid).toBe(true);
      });

      $httpBackend.flush();
    });

    it('should set valid === false for service instance if expired', function () {
      var data = {
        items: [
          { name: 'cluster1', url:' cluster1_url', expires_at: (new Date()).getTime() - 1 },
          { name: 'cluster2', url:' cluster2_url' }
        ]
      };

      $httpBackend.when('GET', '/api/service-instances?username=dev')
        .respond(200, data);

      serviceInstance.list().then(function (response) {
        expect(response.numRegistered).toBe(0);
        expect(serviceInstance.serviceInstances[0].valid).toBe(false);
      });

      $httpBackend.flush();
    });

    it('should return numCompleted on list() with valid+registered service instances', function () {
      var data = {
        items: [
          {
            name: 'cluster1',
            url:' cluster1_url',
            expires_at: (new Date()).getTime() + 360000,
            registered: true
          }
        ]
      };

      $httpBackend.when('GET', '/api/service-instances?username=dev')
        .respond(200, data);

      serviceInstance.list().then(function (response) {
        expect(response.numCompleted).toBe(1);
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

    it('should POST correct data on connect()', function () {
      var data = {
        username: 'dev',
        name: 'service',
        service_user: 'service_user',
        service_token: 'token',
        expires_at: 1000,
        scope: ['role1', 'role2']
      };
      $httpBackend.expectPOST('/api/service-instances/connect', data).respond(200, '');

      var serviceInstanceData = {
        name: 'service',
        service_user: 'service_user',
        service_token: 'token',
        expires_at: 1000,
        scope: ['role1', 'role2']
      };
      serviceInstance.connect(serviceInstanceData);
      $httpBackend.flush();
    });

    it('should POST correct data on disconnect()', function () {
      var data = {
        username: 'dev',
        name: 'service'
      };
      $httpBackend.expectPOST('/api/service-instances/disconnect', data).respond(200, '');

      serviceInstance.disconnect('service');

      $httpBackend.flush();
    });

    it('should POST correct data on register()', function () {
      var data = {
        username: 'dev',
        serviceInstances: ['service']
      };
      $httpBackend.expectPOST('/api/service-instances/register', data).respond(200, '');
      serviceInstance.register(['service']);
      $httpBackend.flush();
    });
  });

})();
