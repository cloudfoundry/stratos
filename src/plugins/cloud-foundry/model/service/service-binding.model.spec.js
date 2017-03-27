(function () {
  'use strict';

  describe('cloud-foundry.model.service-binding', function () {
    var $httpBackend, model, mockBindingsApi;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('modelManager');
      model = modelManager.retrieve('cloud-foundry.model.service-binding');
      mockBindingsApi = mock.cloudFoundryAPI.ServiceBindings;
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('createServiceBinding', function () {
      var bindingSpec = {
        app_guid: 'app_123',
        service_instance_guid: 'instance_123'
      };
      var CreateServiceBinding = mockBindingsApi.CreateServiceBinding(bindingSpec);
      $httpBackend.whenPOST(CreateServiceBinding.url)
        .respond(200, CreateServiceBinding.response['200'].body);
      $httpBackend.expectPOST(CreateServiceBinding.url);

      model.createServiceBinding('guid', bindingSpec)
        .then(function (newBinding) {
          expect(newBinding).toBeDefined();
          expect(newBinding.metadata.guid).toBeDefined();
          expect(newBinding.entity.app_guid).toBe('app_123');
          expect(newBinding.entity.service_instance_guid).toBe('instance_123');
        });

      $httpBackend.flush();
    });

    it('deleteServiceBinding', function () {
      var DeleteServiceBinding = mockBindingsApi.DeleteServiceBinding('123');
      $httpBackend.whenDELETE(DeleteServiceBinding.url).respond(204, DeleteServiceBinding.response['204'].body);
      $httpBackend.expectDELETE(DeleteServiceBinding.url);
      model.deleteServiceBinding('guid', '123');
      $httpBackend.flush();
      expect(DeleteServiceBinding.response['204'].body).toBeDefined();
    });

    it('listAllServiceBindings', function () {
      var ListAllServiceBindings = mockBindingsApi.ListAllServiceBindings();
      var params = '?results-per-page=100';
      $httpBackend.whenGET(ListAllServiceBindings.url + params).respond(200, ListAllServiceBindings.response['200'].body);
      $httpBackend.expectGET(ListAllServiceBindings.url + params);
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
