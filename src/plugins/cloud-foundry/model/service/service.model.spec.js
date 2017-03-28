(function () {
  'use strict';

  describe('service model', function () {
    var $httpBackend, mockServicesApi, serviceModel;

    beforeEach(module('green-box-console'));
    beforeEach(module('cloud-foundry'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var modelManager = $injector.get('modelManager');
      serviceModel = modelManager.retrieve('cloud-foundry.model.service');
      mockServicesApi = mock.cloudFoundryAPI.Services;
    }));

    it('should be defined', function () {
      expect(serviceModel).toBeDefined();
    });

    // property definitions

    it('should have properties `apiManager` and `serviceApi` defined', function () {
      expect(serviceModel.apiManager).toBeDefined();
      expect(serviceModel.serviceApi).toBeDefined();
    });

    it('should have properties `data` defined', function () {
      expect(serviceModel.data).toEqual({});
    });

    // method definitions

    it('should have methods `all` and `onAll` defined', function () {
      expect(angular.isFunction(serviceModel.all)).toBe(true);
      expect(angular.isFunction(serviceModel.onAll)).toBe(true);
    });

    it('should have method `allServicePlans` and `onAllServicePlans` defined', function () {
      expect(angular.isFunction(serviceModel.allServicePlans)).toBe(true);
      expect(angular.isFunction(serviceModel.onAllServicePlans)).toBe(true);
    });

    // method calls
    it('should set `data` on all()', function () {
      var ListAllServices = mockServicesApi.ListAllServices();
      $httpBackend.whenGET(ListAllServices.url).respond(200, ListAllServices.response['200'].body);
      $httpBackend.expectGET(ListAllServices.url);
      serviceModel.all('guid').then(function () {
        expect(serviceModel.data).toBeDefined();
        expect(serviceModel.data.length).toBeGreaterThan(0);
      });
      $httpBackend.flush();
    });

    it('should set `data` on allServicePlans()', function () {
      var ListAllServicePlansForService = mockServicesApi.ListAllServicePlansForService('service_123');
      $httpBackend.whenGET(ListAllServicePlansForService.url)
        .respond(200, ListAllServicePlansForService.response['200'].body);
      $httpBackend.expectGET(ListAllServicePlansForService.url);

      serviceModel.allServicePlans('guid', 'service_123').then(function () {
        expect(serviceModel.data.servicePlans.length).toBeGreaterThan(0);
      });

      $httpBackend.flush();
    });
  });

})();
