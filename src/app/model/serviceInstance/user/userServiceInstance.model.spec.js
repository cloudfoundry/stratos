(function () {
  'use strict';

  describe('user service instance model', function () {
    var $httpBackend, userServiceInstance, mockData;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var modelManager = $injector.get('app.model.modelManager');
      userServiceInstance = modelManager.retrieve('app.model.serviceInstance.user');

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
      expect(userServiceInstance).toBeDefined();
    });

    it('should have initial properties defined', function () {
      expect(userServiceInstance.apiManager).toBeDefined();
      expect(userServiceInstance.serviceInstances).toEqual([]);
      expect(userServiceInstance.numRegistered).toBe(0);
    });

    it('should set `serviceInstances` on list()', function () {
      var expectedData = [
        { name: 'cluster1', url:' cluster1_url' },
        { name: 'cluster2', url:' cluster2_url' }
      ];

      $httpBackend.when('GET', '/api/service-instances/user')
        .respond(200, mockData);

      userServiceInstance.list().then(function (response) {
        expect(response).toEqual({ serviceInstances: expectedData, numCompleted: 0, numRegistered: 0 });
        expect(userServiceInstance.serviceInstances).toEqual(expectedData);
        expect(userServiceInstance.numRegistered).toBe(0);
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

      $httpBackend.when('GET', '/api/service-instances/user')
        .respond(200, data);

      userServiceInstance.list().then(function (response) {
        expect(response.numRegistered).toBe(1);
        expect(userServiceInstance.serviceInstances[0].valid).toBe(true);
      });

      $httpBackend.flush();
    });

    it('should set valid === false for service instance if expired', function () {
      var now = (new Date()).getTime() / 1000;
      var data = {
        items: [
          { name: 'cluster1', url:' cluster1_url', expires_at: now - 1 },
          { name: 'cluster2', url:' cluster2_url' }
        ]
      };

      $httpBackend.when('GET', '/api/service-instances/user')
        .respond(200, data);

      userServiceInstance.list().then(function (response) {
        expect(response.numRegistered).toBe(0);
        expect(userServiceInstance.serviceInstances[0].valid).toBe(false);
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

      $httpBackend.when('GET', '/api/service-instances/user')
        .respond(200, data);

      userServiceInstance.list().then(function (response) {
        expect(response.numCompleted).toBe(1);
      });

      $httpBackend.flush();
    });

    it('should not set `serviceInstances` on list() and error', function () {
      $httpBackend.when('GET', '/api/service-instances/user')
        .respond(403, {});

      userServiceInstance.list().then(function () {}, function (error) {
        expect(error.status).toBe(403);
        expect(error.data).toEqual({});
        expect(userServiceInstance.serviceInstances).toEqual([]);
        expect(userServiceInstance.numRegistered).toBe(0);
      });

      $httpBackend.flush();
    });

    it('should POST correct data on connect()', function () {
      $httpBackend.expectPOST('/api/service-instances/user/connect', { url: 'url' }).respond(200, '');
      userServiceInstance.connect('url');
      $httpBackend.flush();
    });

    it('should POST correct data on disconnect()', function () {
      $httpBackend.expectPOST('/api/service-instances/user/disconnect', { url: 'url' }).respond(200, '');
      userServiceInstance.disconnect('url');
      $httpBackend.flush();
    });

    it('should POST correct data on register()', function () {
      var data = {
        serviceInstances: ['url1', 'url2']
      };
      $httpBackend.expectPOST('/api/service-instances/user/register', data).respond(200, '');
      userServiceInstance.register(['url1', 'url2']);
      $httpBackend.flush();
    });
  });

})();
