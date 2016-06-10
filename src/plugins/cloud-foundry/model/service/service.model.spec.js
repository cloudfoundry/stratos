(function () {
  'use strict';

  describe('service model', function () {
    var $httpBackend, serviceModel, mockData;

    beforeEach(module('green-box-console'));
    beforeEach(module('cloud-foundry'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var modelManager = $injector.get('app.model.modelManager');
      serviceModel = modelManager.retrieve('cloud-foundry.model.service');
    }));

    it('should be defined', function () {
      expect(serviceModel).toBeDefined();
    });

    // property definitions

    it('should have properties `apiManager` defined', function () {
      expect(serviceModel.serviceApi).toBeDefined();
    });

    it('should have properties `data` defined', function () {
      expect(serviceModel.data).toBeDefined();
      expect(serviceModel.data).toEqual({});
    });

    // method definitions

    it('should have method `all` defined', function () {
      expect(angular.isFunction(serviceModel.all)).toBe(true);
    });

    it('should have method `usage` defined', function () {
      expect(angular.isFunction(serviceModel.usage)).toBe(true);
    });

    it('should have method `files` defined', function () {
      expect(angular.isFunction(serviceModel.files)).toBe(true);
    });

    it('should have method `onAll` defined', function () {
      expect(angular.isFunction(serviceModel.onAll)).toBe(true);
    });

    it('should have method `onUsage` defined', function () {
      expect(angular.isFunction(serviceModel.onUsage)).toBe(true);
    });

    it('should have method `onFiles` defined', function () {
      expect(angular.isFunction(serviceModel.onFiles)).toBe(true);
    });

    // method calls
    it('should set `data` on all()', function () {
      var ListAllServices = mock.cloudFoundryAPI.Services.ListAllServices();
      $httpBackend.whenGET(ListAllServices.url).respond(200, ListAllServices.response['200'].body);
      $httpBackend.expectGET(ListAllServices.url);
      serviceModel.all('guid').then(function (resources) {
        expect(serviceModel.data).toBeDefined();
      });
      $httpBackend.flush();
    });

  });

})();
