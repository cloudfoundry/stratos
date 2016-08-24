(function () {
  'use strict';

  describe('user service instance model', function () {
    var $httpBackend, $httpParamSerializer, userServiceInstance, mockData;

    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $httpParamSerializer = $injector.get('$httpParamSerializer');

      var modelManager = $injector.get('app.model.modelManager');
      userServiceInstance = modelManager.retrieve('app.model.serviceInstance.user');

      mockData = [
        { guid: 'c1', name: 'cluster1', url:' cluster1_url' },
        { guid: 'c2', name: 'cluster2', url:' cluster2_url' }
      ];
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(userServiceInstance).toBeDefined();
    });

    it('should have initial properties defined', function () {
      expect(userServiceInstance.$q).toBeDefined();
      expect(userServiceInstance.apiManager).toBeDefined();
      expect(userServiceInstance.serviceInstances).toEqual({});
      expect(userServiceInstance.numValid).toBe(0);
    });

    it('should POST correct data on connect()', function () {
      var data = { cnsi_guid: 'c1', username: 'username', password: 'password' };
      $httpBackend.expectPOST('/pp/v1/auth/login/cnsi', $httpParamSerializer(data)).respond(200, {});
      userServiceInstance.connect('c1', 'name', 'username', 'password');
      $httpBackend.flush();
    });

    it('should POST correct data on disconnect()', function () {
      var data = { cnsi_guid: 'cnsi_guid' };
      $httpBackend.expectPOST('/pp/v1/auth/logout/cnsi', $httpParamSerializer(data)).respond(200, {});
      userServiceInstance.disconnect('cnsi_guid');
      $httpBackend.flush();
    });

    it('should set `serviceInstances` on list()', function () {
      var expectedData = {
        c1: { guid: 'c1', name: 'cluster1', url:' cluster1_url' },
        c2: { guid: 'c2', name: 'cluster2', url:' cluster2_url' }
      };

      $httpBackend.when('GET', '/pp/v1/proxy/v2/info').respond(200, {});
      $httpBackend.when('GET', '/pp/v1/cnsis/registered')
        .respond(200, mockData);

      userServiceInstance.list().then(function (response) {
        expect(response).toEqual(expectedData);
        expect(userServiceInstance.serviceInstances).toEqual(expectedData);
        expect(userServiceInstance.numValid).toBe(0);
      });

      $httpBackend.flush();
    });

    it('should not set `serviceInstances` on list() if no clusters', function () {
      $httpBackend.when('GET', '/pp/v1/proxy/v2/info').respond(200, {});
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, []);

      userServiceInstance.list().then(function (response) {
        expect(response).toEqual({});
        expect(userServiceInstance.serviceInstances).toEqual({});
        expect(userServiceInstance.numValid).toBe(0);
      });

      $httpBackend.flush();
    });

    it('should set valid === true for service instance if not expired', function () {
      var data = [
        { guid: 'c1', name: 'cluster1', url:' cluster1_url', token_expiry: (new Date()).getTime() + 36000 },
        { guid: 'c2', name: 'cluster2', url:' cluster2_url' }
      ];

      $httpBackend.when('GET', '/pp/v1/proxy/v2/info').respond(200, {});
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, data);

      userServiceInstance.list().then(function () {
        expect(userServiceInstance.numValid).toBe(1);
        expect(userServiceInstance.serviceInstances.c1.valid).toBe(true);
      });

      $httpBackend.flush();
    });

    it('should set valid === false for service instance if expired', function () {
      var now = (new Date()).getTime() / 1000;
      var data = [
        { guid: 'c1', name: 'cluster1', url:' cluster1_url', token_expiry: now - 1 },
        { guid: 'c2', name: 'cluster2', url:' cluster2_url' }
      ];

      $httpBackend.when('GET', '/pp/v1/proxy/v2/info').respond(200, {});
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, data);

      userServiceInstance.list().then(function () {
        expect(userServiceInstance.numValid).toBe(0);
        expect(userServiceInstance.serviceInstances.c1.valid).toBe(false);
      });

      $httpBackend.flush();
    });

    it('should not set `serviceInstances` on list() and error', function () {
      $httpBackend.when('GET', '/pp/v1/proxy/v2/info').respond(200, {});
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(403, {});

      userServiceInstance.list().then(function () {}, function (error) {
        expect(error.status).toBe(403);
        expect(error.data).toEqual({});
        expect(userServiceInstance.serviceInstances).toEqual({});
        expect(userServiceInstance.numValid).toBe(0);
      });

      $httpBackend.flush();
    });


    // An error getting info should not fail the list call
    it('should set `serviceInstances` on list() and info error', function () {
      var data = [
        { guid: 'c1', name: 'cluster1', cnsi_type: 'hcf', url:' cluster1_url', token_expiry: (new Date()).getTime() + 36000 },
        { guid: 'c2', name: 'cluster2', cnsi_type: 'hcf', url:' cluster2_url' }
      ];

      $httpBackend.when('GET', '/pp/v1/proxy/v2/info').respond(403, {});
      $httpBackend.when('GET', '/pp/v1/cnsis/registered').respond(200, data);

      userServiceInstance.list().then(function (response) {
        expect(Object.keys(response).length).toBe(2);
        expect(response.c1).toBeDefined();
        expect(response.c2).toBeDefined();
        expect(userServiceInstance.numValid).toBe(1);
      });

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
