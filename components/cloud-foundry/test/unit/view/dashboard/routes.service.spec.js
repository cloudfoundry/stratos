(function () {
  'use strict';

  describe('Routes Service test', function () {
    var $httpBackend, appClusterRoutesService, $uibModal;

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
    beforeEach(module('console-app'));

    beforeEach(inject(function ($injector) {
      $uibModal = $injector.get('$uibModal');

      appClusterRoutesService = $injector.get('appClusterRoutesService');

      $httpBackend = $injector.get('$httpBackend');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(appClusterRoutesService).toBeDefined();
      expect(appClusterRoutesService.getRouteId).toBeDefined();
      expect(appClusterRoutesService.unmapAppRoute).toBeDefined();
      expect(appClusterRoutesService.unmapAppsRoute).toBeDefined();
      expect(appClusterRoutesService.deleteRoute).toBeDefined();
    });

    it('getRouteId', function () {
      var id = appClusterRoutesService.getRouteId(route);
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
      appClusterRoutesService.unmapAppRoute(cnsiGuid, route, routeGuid, appGuid).catch(function () {
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
      appClusterRoutesService.unmapAppsRoute(cnsiGuid, route, routeGuid, appGuids).catch(function () {
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
      appClusterRoutesService.deleteRoute(cnsiGuid, route, routeGuid, appGuid).catch(function () {
        fail('deleteRoute should not have errored');
      });

      $httpBackend.flush();

    });

  });
})();
