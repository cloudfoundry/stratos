(function () {
  'use strict';

  describe('summary view', function () {

    var $controller;

    var cnsiGuid = 'cnsiGuid';
    var spaceGuid = 'spaceGuid';
    beforeEach(module('console-app'));

    function initController($injector, mockAuthModel, role) {
      var modelManager = $injector.get('modelManager');
      var $stateParams = $injector.get('$stateParams');
      var $state = $injector.get('$state');
      var $translate = $injector.get('$translate');
      var $log = $injector.get('$log');
      var $q = $injector.get('$q');
      var addRoutesService = $injector.get('cfAddRoutes');
      var editAppService = $injector.get('cfEditApp');
      var appUtilsService = $injector.get('appUtilsService');
      var appClusterRoutesService = $injector.get('appClusterRoutesService');
      var cfApplicationTabs = $injector.get('cfApplicationTabs');
      var appNotificationsService = $injector.get('appNotificationsService');
      var frameworkDialogConfirm = $injector.get('frameworkDialogConfirm');

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

      spyOn(appModel, 'getAppVariables').and.returnValue($q.reject());

      var ApplicationSummaryController = $state.get('cf.applications.application.summary').controller;
      $controller = new ApplicationSummaryController($state, $stateParams, $log, $q, $translate, modelManager,
        addRoutesService, editAppService, appUtilsService, appClusterRoutesService, frameworkDialogConfirm,
        appNotificationsService, cfApplicationTabs);

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
    });

    describe('summary action permission - admin', function () {
      testSummaryAction('admin');
    });

    describe('summary action permission - space dev', function () {
      testSummaryAction('space_developer');
    });

    function testSummaryAction(role) {
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
        expect($controller.routesActionMenu[0].hidden).toBe(false);
      });

      it('should have `delete route` enabled for ' + role, function () {
        expect($controller.routesActionMenu[1].disabled).toBe(false);
        expect($controller.routesActionMenu[1].hidden).toBe(false);
      });

      it('should have `manage services` enabled for ' + role, function () {
        expect($controller.hideManageServices).toBe(false);
      });
    }

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
        expect($controller.routesActionMenu[0].hidden).toBe(true);
      });

      it('should have `delete route` disabled', function () {
        expect($controller.routesActionMenu[1].hidden).toBe(true);
      });

      it('should have `manage services` disabled', function () {
        expect($controller.hideManageServices).toBe(true);
      });
    });
  });
})();
