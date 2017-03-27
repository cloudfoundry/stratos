(function () {
  'use strict';

  describe('cloud-foundry.model.user-provided-service-instance', function () {
    var $httpBackend, model;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('modelManager');
      model = modelManager.retrieve('cloud-foundry.model.user-provided-service-instance');
      //mockInstancesApi = mock.cloudFoundryAPI.ServiceInstances;
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('is defined', function () {
      expect(model).toBeDefined();
    });
    /*

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
    */
  });
})();
