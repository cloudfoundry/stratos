(function () {
  'use strict';

  describe('Routes Service test', function () {
    var $httpBackend, routesService, $uibModal;

    var host = 'host';
    var domain = 'domain';
    var port = 'port';
    var path = 'path';

    var route = {
      entity: {
        domain: {
          entity: {
            name: domain
          }
        },
        host: host,
        port: port,
        path: path
      }
    };

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $uibModal = $injector.get('$uibModal');

      routesService = $injector.get('app.view.endpoints.clusters.routesService');

      $httpBackend = $injector.get('$httpBackend');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(routesService).toBeDefined();
      expect(routesService.getRouteId).toBeDefined();
      expect(routesService.unmapAppRoute).toBeDefined();
      expect(routesService.unmapAppsRoute).toBeDefined();
      expect(routesService.deleteRoute).toBeDefined();
    });

    it('getRouteId', function () {
      var id = routesService.getRouteId(route);
      expect(id).toEqual(host + '.' + domain + ':' + port + path);
    });

    it('unmapAppRoute', function () {
      var cnsiGuid = 'guid';
      var routeGuid = 'routeGuid';
      var appGuid = 'appGuid';

      spyOn($uibModal, 'open').and.callFake(function (config) {
        return { result:  config.resolve.confirmDialogContext().callback() };
      });

      $httpBackend.expectDELETE('/pp/v1/proxy/v2/routes/' + routeGuid + '/apps/' + appGuid).respond({});
      routesService.unmapAppRoute(cnsiGuid, route, routeGuid, appGuid).catch(function () {
        fail('unmapAppRoute should not have errored');
      });

      $httpBackend.flush();

    });

    it('unmapAppRoutes', function () {
      var cnsiGuid = 'guid';
      var routeGuid = 'routeGuid';
      var appGuids = ['appGuid', 'appGuid2'];

      spyOn($uibModal, 'open').and.callFake(function (config) {
        return { result:  config.resolve.confirmDialogContext().callback() };
      });

      $httpBackend.expectDELETE('/pp/v1/proxy/v2/routes/' + routeGuid + '/apps/' + appGuids[0]).respond({});
      $httpBackend.expectDELETE('/pp/v1/proxy/v2/routes/' + routeGuid + '/apps/' + appGuids[1]).respond({});
      routesService.unmapAppsRoute(cnsiGuid, route, routeGuid, appGuids).catch(function () {
        fail('unmapAppsRoutes should not have errored');
      });

      $httpBackend.flush();

    });

    it('deleteRoute', function () {
      var cnsiGuid = 'guid';
      var routeGuid = 'routeGuid';
      var appGuid = 'appGuid';

      spyOn($uibModal, 'open').and.callFake(function (config) {
        return { result:  config.resolve.confirmDialogContext().callback() };
      });

      $httpBackend.expectDELETE('/pp/v1/proxy/v2/routes/' + routeGuid + '?recursive=true').respond({});
      routesService.deleteRoute(cnsiGuid, route, routeGuid, appGuid).catch(function () {
        fail('deleteRoute should not have errored');
      });

      $httpBackend.flush();


    });

  });
})();
