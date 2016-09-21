(function () {
  'use strict';

  fdescribe('Routes Service test', function () {
    var $httpBackend, routesService, confirmDialog;

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
      // var modelManager = $injector.get('app.model.modelManager');
      // var notificationsService = $injector.get('app.view.notificationsService');
      confirmDialog = $injector.get('helion.framework.widgets.dialog.confirm');

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

      $httpBackend.expectGET('ssdfdsf').respond();
      routesService.unmapAppRoute(cnsiGuid, route, routeGuid, appGuid).then(function () {

      }).catch(function () {
        fail('unmapAppRoute should not have errored');
      });

      console.log('confirmDialog ', confirmDialog);
      confirmDialog.confirmed();
    });

  });
})();
