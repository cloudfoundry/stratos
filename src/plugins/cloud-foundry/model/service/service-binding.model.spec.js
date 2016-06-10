(function () {
  'use strict';

  describe('cloud-foundry.model.service-binding', function () {
    var $httpBackend, model;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');
      model = modelManager.retrieve('cloud-foundry.model.service-binding');
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('deleteServiceBinding', function () {
      var DeleteServiceBinding = mock.cloudFoundryAPI.ServiceBindings.DeleteServiceBinding('123');
      $httpBackend.whenDELETE(DeleteServiceBinding.url).respond(204, DeleteServiceBinding.response['204'].body);
      $httpBackend.expectDELETE(DeleteServiceBinding.url);
      model.deleteServiceBinding('guid', '123');
      $httpBackend.flush();
      expect(DeleteServiceBinding.response['204'].body).toBeDefined();
    });

    it('listAllServiceBindings', function () {
      var ListAllServiceBindings = mock.cloudFoundryAPI.ServiceBindings.ListAllServiceBindings();
      $httpBackend.whenGET(ListAllServiceBindings.url).respond(200, ListAllServiceBindings.response['200'].body);
      $httpBackend.expectGET(ListAllServiceBindings.url);
      var result;
      expect(result).not.toBeDefined();
      model.listAllServiceBindings('guid', {}).then(function (resources) {
        result = resources;
      });
      $httpBackend.flush();
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });
  });

})();
