(function () {
  'use strict';

  describe('cloud-foundry route model', function () {
    var $httpBackend, routeModel;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');
      routeModel = modelManager.retrieve('cloud-foundry.model.route');
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('removeAppFromRoute', function () {
      var RemoveAppFromRoute = mock.cloudFoundryAPI.Routes.RemoveAppFromRoute('123', '456');
      $httpBackend.whenDELETE(RemoveAppFromRoute.url).respond(204, RemoveAppFromRoute.response['204'].body);
      $httpBackend.expectDELETE(RemoveAppFromRoute.url);
      routeModel.removeAppFromRoute('123', '456');
      $httpBackend.flush();
      expect(RemoveAppFromRoute.response['204'].body).toBeDefined();
    });

    it('deleteRoute', function () {
      var DeleteRoute = mock.cloudFoundryAPI.Routes.DeleteRoute('123');
      $httpBackend.whenDELETE(DeleteRoute.url).respond(204, DeleteRoute.response['204'].body);
      $httpBackend.expectDELETE(DeleteRoute.url);
      routeModel.deleteRoute('123');
      $httpBackend.flush();
      expect(DeleteRoute.response['204'].body).toBeDefined();
    });

    it('ListAllAppsForRoute', function () {
      var ListAllAppsForRoute = mock.cloudFoundryAPI.Routes.ListAllAppsForRoute('123');
      $httpBackend.whenGET(ListAllAppsForRoute.url).respond(200, ListAllAppsForRoute.response['200'].body);
      $httpBackend.expectGET(ListAllAppsForRoute.url);
      routeModel.listAllAppsForRoute('123');
      $httpBackend.flush();
      expect(routeModel.route.id).toBe('123');
      expect(routeModel.route.apps).toEqual(ListAllAppsForRoute.response['200'].body);
    });

    it('listAllAppsForRouteWithoutStore', function () {
      var ListAllAppsForRoute = mock.cloudFoundryAPI.Routes.ListAllAppsForRoute('123');
      $httpBackend.whenGET(ListAllAppsForRoute.url).respond(200, ListAllAppsForRoute.response['200'].body);
      $httpBackend.expectGET(ListAllAppsForRoute.url);

      var result;
      expect(result).not.toBeDefined();
      routeModel.listAllAppsForRouteWithoutStore('123').then(function (resources) {
        result = resources;
      });
      $httpBackend.flush();
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });
  });

})();
