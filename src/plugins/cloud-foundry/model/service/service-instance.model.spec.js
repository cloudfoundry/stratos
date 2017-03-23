(function () {
  'use strict';

  describe('cloud-foundry.model.service-instance', function () {
    var $httpBackend, model, mockInstancesApi;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('modelManager');
      model = modelManager.retrieve('cloud-foundry.model.service-instance');
      mockInstancesApi = mock.cloudFoundryAPI.ServiceInstances;
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('all', function () {
      var ListAllServiceInstances = mockInstancesApi.ListAllServiceInstances();
      $httpBackend.whenGET(ListAllServiceInstances.url)
        .respond(200, ListAllServiceInstances.response['200'].body);
      $httpBackend.expectGET(ListAllServiceInstances.url);

      model.all('guid').then(function (serviceInstances) {
        expect(serviceInstances.length).toBeGreaterThan(0);
      });

      $httpBackend.flush();
    });

    it('createServiceInstance', function () {
      var instanceSpec = {
        name: 'name',
        space_guid: 'space_123',
        service_plan_guid: 'plan_123'
      };
      var CreateServiceInstance = mockInstancesApi.CreateServiceInstance(instanceSpec);
      $httpBackend.whenPOST(CreateServiceInstance.url)
        .respond(200, CreateServiceInstance.response['200'].body);
      $httpBackend.expectPOST(CreateServiceInstance.url);

      model.createServiceInstance('guid', instanceSpec)
        .then(function (newInstance) {
          expect(newInstance).toBeDefined();
          expect(newInstance.metadata.guid).toBeDefined();
          expect(newInstance.entity.name).toBe('name');
          expect(newInstance.entity.service_plan_guid).toBe('plan_123');
          expect(newInstance.entity.space_guid).toBe('space_123');
        });

      $httpBackend.flush();
    });
  });
})();
