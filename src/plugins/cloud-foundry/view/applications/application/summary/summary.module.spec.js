(function () {
  'use strict';

  describe('summary view', function () {

    var $controller;

    var cnsiGuid = 'cnsiGuid';
    var spaceGuid = 'spaceGuid';
    beforeEach(module('green-box-console'));

    function initController($injector, mockAuthModel, role) {
      var modelManager = $injector.get('app.model.modelManager');
      var $stateParams = $injector.get('$stateParams');
      var $state = $injector.get('$state');
      var $scope = $injector.get('$rootScope');
      var $filter = $injector.get('$filter');
      var $log = $injector.get('$log');
      var $q = $injector.get('$q');
      var addRoutesService = $injector.get('cloud-foundry.view.applications.application.summary.addRoutes');
      var editAppService = $injector.get('cloud-foundry.view.applications.application.summary.editApp');
      var utils = $injector.get('app.utils.utilsService');
      var routesService = $injector.get('app.view.endpoints.clusters.routesService');

      $stateParams.cnsiGuid = cnsiGuid;
      if (mockAuthModel) {
        var authModel = modelManager.retrieve('cloud-foundry.model.auth');
        spyOn(authModel, 'isAllowed').and.callFake(function () {
          // Everything is allowed in tests
          return true;
        });
      } else {
        var authModelOpts = {
          role: role,
          cnsiGuid: cnsiGuid,
          spaceGuid: spaceGuid
        };
        mock.cloudFoundryModel.Auth.initAuthModel($injector, authModelOpts);
      }
      var appModel = modelManager.retrieve('cloud-foundry.model.application');
      _.set(appModel, 'application.summary.space_guid', spaceGuid);

      var ApplicationSummaryController = $state.get('cf.applications.application.summary').controller;
      $controller = new ApplicationSummaryController($state, $stateParams, $log, $q, $scope, $filter, modelManager, addRoutesService, editAppService, utils, routesService);

      expect($controller).toBeDefined();
      expect($controller).not.toBe(null);
      expect($controller.isWebLink).toBeDefined();
    }

    describe('with mocked authService', function () {

      beforeEach(inject(function ($injector) {
        initController($injector, true);

      }));

      describe('buildpack links', function () {
        beforeEach(function () {
          expect($controller.isWebLink).toBeDefined();

        });

        it('http buildpack is a web link', function () {
          expect($controller.isWebLink('http://www.test.com')).toBe(true);
          expect($controller.isWebLink('  http://www.test.com')).toBe(true);
        });

        it('https buildpack is a web link', function () {
          expect($controller.isWebLink('https://www.test.com')).toBe(true);
          expect($controller.isWebLink(' https://www.test.com')).toBe(true);
        });

        it('empty buildpack is not a web link', function () {
          expect($controller.isWebLink('')).toBe(false);
          expect($controller.isWebLink(' ')).toBe(false);
          expect($controller.isWebLink(undefined)).toBe(false);
          expect($controller.isWebLink(null)).toBe(false);
        });

        it('name buildpack is not a web link', function () {
          expect($controller.isWebLink('name')).toBe(false);
          expect($controller.isWebLink(' name')).toBe(false);
        });

      });

      describe('format uptime', function () {
        beforeEach(function () {
          expect($controller.formatUptime).toBeDefined();
        });

        it('formats undefined and null correctly', function () {
          expect($controller.formatUptime(null)).toBe('-');
          expect($controller.formatUptime(undefined)).toBe('-');
        });

        it('formats 0 correctly', function () {
          expect($controller.formatUptime(0)).toBe('0s');
        });

        it('formats 1 correctly', function () {
          expect($controller.formatUptime(1)).toBe('1s');
        });

        it('formats day uptime correctly', function () {
          expect($controller.formatUptime(86400)).toBe('1d');
          expect($controller.formatUptime(172800)).toBe('2d');
        });

        it('formats mixed uptime correctly', function () {
          expect($controller.formatUptime(3661)).toBe('1h 1m 1s');
          expect($controller.formatUptime(3665)).toBe('1h 1m 5s');
          expect($controller.formatUptime(7200)).toBe('2h');
          expect($controller.formatUptime(7320)).toBe('2h 2m');
          expect($controller.formatUptime(172800 + 7321)).toBe('2d 2h 2m 1s');
          expect($controller.formatUptime(172800 + 7327)).toBe('2d 2h 2m 7s');
        });

      });
    });

    describe('summary action permission', function () {
        // var roles = ['admin', 'space_developer'];
      var roles = ['space_developer'];

      _.each(roles, function (role) {

        beforeEach(inject(function ($injector) {
          initController($injector, false, role);
        }));

        it('should have `Edit` enabled for ' + role, function () {
          expect($controller.hideEditApp).toBe(false);
        });

        it('should have `Add Route` enabled for ' + role, function () {
          expect($controller.hideAddRoutes).toBe(false);
        });

        it('should have `Unmap route from app` enabled for ' + role, function () {
          expect($controller.routesActionMenu[0].disabled).toBe(false);
        });

        it('should have `delete route` enabled for ' + role, function () {
          expect($controller.routesActionMenu[1].disabled).toBe(false);
        });

        it('should have `manage services` enabled for ' + role, function () {
          expect($controller.hideManageServices).toBe(false);
        });
      });
    });

    describe('summary for non dev user', function () {

      beforeEach(inject(function ($injector) {
        initController($injector, false, 'space_manager');
      }));

      it('should have `Edit` disabled', function () {
        expect($controller.hideEditApp).toBe(true);

      });

      it('should have `Add Route` disabled', function () {
        expect($controller.hideAddRoutes).toBe(true);
      });

      it('should have `Unmap route from app` disabled', function () {
        expect($controller.routesActionMenu[0].disabled).toBe(true);
      });

      it('should have `delete route` disabled', function () {
        expect($controller.routesActionMenu[1].disabled).toBe(true);
      });

      it('should have `manage services` disabled', function () {
        expect($controller.hideManageServices).toBe(true);
      });
    });
  });
})();
