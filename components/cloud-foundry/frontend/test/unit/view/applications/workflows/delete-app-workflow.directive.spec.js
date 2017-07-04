(function () {
  'use strict';

  /* eslint-disable angular/no-private-call */
  describe('delete-app-workflow directive - ', function () {
    var $httpBackend, $scope, that, listAllAppsForRouteCall, ListAllAppsForRoute, cfApplicationTabs, $q, appModel,
      routeModel, cfServiceDeleteAppWorkflow;
    var appGuid = 'app_123';

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      var modelManager = $injector.get('modelManager');
      appModel = modelManager.retrieve('cloud-foundry.model.application');
      routeModel = modelManager.retrieve('cloud-foundry.model.route');
      cfApplicationTabs = $injector.get('cfApplicationTabs');
      cfServiceDeleteAppWorkflow = $injector.get('cfServiceDeleteAppWorkflow');
      $q = $injector.get('$q');

      var mockAppsApi = mock.cloudFoundryAPI.Apps;
      var GetAppSummary = mockAppsApi.GetAppSummary(appGuid);
      appModel.application = {
        summary: GetAppSummary.response['200'].body
      };

      $scope.guids = {
        cnsiGuid: 'cnsiGuid'
      };

      $scope.testNoOp = function () {};
      var routeGuid = '84a911b3-16f7-4f47-afa4-581c86018600';
      ListAllAppsForRoute = mock.cloudFoundryAPI.Routes.ListAllAppsForRoute(routeGuid);
      listAllAppsForRouteCall = $httpBackend.whenGET(ListAllAppsForRoute.url + '?results-per-page=1').respond(ListAllAppsForRoute.response[200].body);

      var markup = '<delete-app-workflow guids="guids" close-dialog="testNoOp" dismiss-dialog="testNoOp"></delete-app-workflow>';
      var element = angular.element(markup);
      $compile(element)($scope);
      $scope.$apply();

      that = element.controller('deleteAppWorkflow');
      $httpBackend.flush();
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be compilable', function () {
      expect(that).toBeDefined();
    });

    describe('after resetting -', function () {
      beforeEach(function () {
        that.reset();
      });

      it('should be set properly', function () {
        expect(that.cnsiGuid).toBe(null);
        expect(that.data).toBeDefined();
        expect(that.userInput.checkedRouteValue).toBeDefined();
        expect(that.userInput.checkedServiceValue).toBeDefined();
        expect(that.data.workflow).toBeDefined();
        expect(that.options).toEqual({
          workflow: that.data.workflow,
          userInput: that.userInput,
          appModel: appModel,
          isBusy: true,
          isDeleting: false,
          hasError: false,
          safeRoutes: [],
          safeServices: []
        });
        expect(that.deleteApplicationActions.stop).toBeDefined();
        expect(that.deleteApplicationActions.finish).toBeDefined();
      });

      it('workflow - initControllers', function () {
        that.checkAppRoutes = function () {
          return $q.resolve();
        };
        spyOn(that, 'checkAppServices');
        spyOn(that, 'checkAppRoutes').and.callThrough();
        var deferred = $q.defer();
        var wizard = {
          postInitTask: deferred
        };
        deferred.resolve();

        that.data.workflow.initControllers(wizard);
        $scope.$apply();
        expect(that.options.isBusy).toBe(false);
        expect(that.wizard.nextBtnDisabled).toBe(false);
        expect(that.checkAppServices).toHaveBeenCalled();
        expect(that.checkAppRoutes).toHaveBeenCalled();
      });

      it('deleteApplicationActions - stop', function () {
        spyOn(that, 'stopWorkflow');
        that.deleteApplicationActions.stop();
        expect(that.stopWorkflow).toHaveBeenCalled();
      });

      it('deleteApplicationActions - finish', function () {
        that.finishWorkflow = function () {
          return $q.reject();
        };
        spyOn(that, 'finishWorkflow').and.callThrough();
        that.deleteApplicationActions.finish({
          disableButtons: function () {},
          resetButtons: function () {}
        });
        expect(that.finishWorkflow).toHaveBeenCalled();
      });

      it('#checkAppRoutes', function () {
        listAllAppsForRouteCall.respond(ListAllAppsForRoute.response[200].body);
        $httpBackend.expectGET(ListAllAppsForRoute.url + '?results-per-page=1');
        expect(that.options.safeRoutes.length).toBe(0);
        that.checkAppRoutes();
        $httpBackend.flush();
        expect(that.options.safeRoutes.length).toBeGreaterThan(0);
      });

      it('#checkAppRoutes - multi-binding', function () {
        listAllAppsForRouteCall.respond(angular.extend({}, ListAllAppsForRoute.response[200].body, {
          total_results: 2
        }));
        $httpBackend.expectGET(ListAllAppsForRoute.url + '?results-per-page=1');
        expect(that.options.safeRoutes.length).toBe(0);
        that.checkAppRoutes();
        $httpBackend.flush();
        expect(that.options.safeRoutes.length).toBe(0);
      });

      it('#checkAppServices', function () {
        expect(that.options.safeServices.length).toBe(0);
        that.checkAppServices();
        expect(that.options.safeServices.length).toBeGreaterThan(0);
      });

      it('#deleteApp', function () {
        that.removeAppFromRoutes = function () { return $q.resolve(); };
        that.tryDeleteEachRoute = function () { return $q.resolve(); };
        that.deleteServiceBindings = function () { return $q.resolve(); };
        that.deleteProject = function () { return $q.resolve(); };
        appModel.deleteApp = function () { return $q.resolve(); };
        spyOn(that, 'removeAppFromRoutes').and.callThrough();
        spyOn(that, 'tryDeleteEachRoute').and.callThrough();
        spyOn(that, 'deleteServiceBindings').and.callThrough();
        spyOn(cfApplicationTabs, 'appDeleting').and.callThrough();
        spyOn(appModel, 'deleteApp').and.callThrough();

        that.deleteApp();
        $scope.$apply();

        expect(that.removeAppFromRoutes).toHaveBeenCalled();
        expect(that.tryDeleteEachRoute).toHaveBeenCalled();
        expect(that.deleteServiceBindings).toHaveBeenCalled();
        expect(cfApplicationTabs.appDeleting).toHaveBeenCalled();
        expect(appModel.deleteApp).toHaveBeenCalled();
      });

      it('#removeAppFromRoutes', function () {
        var routeGuid = '84a911b3-16f7-4f47-afa4-581c86018600';
        var RemoveAppFromRoute = mock.cloudFoundryAPI.Routes.RemoveAppFromRoute(routeGuid, appGuid);
        $httpBackend.whenDELETE(RemoveAppFromRoute.url).respond(RemoveAppFromRoute.response[204].body);
        $httpBackend.expectDELETE(RemoveAppFromRoute.url);
        spyOn(routeModel, 'removeAppFromRoute').and.callThrough();
        var numCheckedRoutes = Object.keys(that.userInput.checkedRouteValue).length;

        that.removeAppFromRoutes();
        $httpBackend.flush();

        expect(routeModel.removeAppFromRoute).toHaveBeenCalledTimes(numCheckedRoutes);
      });

      it('#deleteServiceBindings - no services checked', function () {
        that.userInput.checkedServiceValue = {};
        spyOn(appModel, 'listServiceBindings');

        that.deleteServiceBindings();
        $scope.$apply();

        expect(appModel.listServiceBindings).not.toHaveBeenCalled();
      });

      it('#deleteServiceBindings - has services checked', function () {
        spyOn(cfServiceDeleteAppWorkflow, 'unbindServiceInstances').and.returnValue($q.resolve());
        spyOn(cfServiceDeleteAppWorkflow, 'deleteServiceInstances').and.returnValue($q.resolve());

        that.deleteServiceBindings();
        $scope.$apply();

        expect(cfServiceDeleteAppWorkflow.unbindServiceInstances).toHaveBeenCalled();
        expect(cfServiceDeleteAppWorkflow.deleteServiceInstances).toHaveBeenCalled();
      });

      it('#deleteRouteIfPossible - do not delete', function () {
        var routeId = 'foo';
        routeModel.listAllAppsForRouteWithoutStore = function () {
          return $q.resolve({
            total_results: 1
          });
        };
        spyOn(routeModel, 'listAllAppsForRouteWithoutStore').and.callThrough();

        that.deleteRouteIfPossible(routeId);
        $scope.$apply();

        expect(routeModel.listAllAppsForRouteWithoutStore).toHaveBeenCalled();
      });

      it('#deleteRouteIfPossible', function () {
        var routeId = 'foo';
        routeModel.listAllAppsForRouteWithoutStore = function () {
          return $q.resolve({
            total_results: 0
          });
        };
        routeModel.deleteRoute = function () {
          return $q.resolve();
        };

        spyOn(routeModel, 'listAllAppsForRouteWithoutStore').and.callThrough();
        spyOn(routeModel, 'deleteRoute').and.callThrough();

        that.deleteRouteIfPossible(routeId);
        $scope.$apply();

        expect(routeModel.listAllAppsForRouteWithoutStore).toHaveBeenCalled();
        expect(routeModel.deleteRoute).toHaveBeenCalled();
      });

      it('#tryDeleteEachRoute', function () {
        that.userInput.checkedRouteValue = {
          foo: { value: 'foo' },
          bar: { value: 'bar' }
        };
        var length = Object.keys(that.userInput.checkedRouteValue).length;

        that.deleteRouteIfPossible = function () {
          return $q.resolve();
        };
        spyOn(that, 'deleteRouteIfPossible').and.callThrough();

        that.tryDeleteEachRoute();
        $scope.$apply();

        expect(that.deleteRouteIfPossible).toHaveBeenCalledTimes(length);
      });

      it('#deleteProject - project is defined', function () {
        appModel.application.project = {};
        cfApplicationTabs.appDeleting = function () {
          return $q.resolve();
        };
        that.details = {
          project: 'project'
        };
        spyOn(cfApplicationTabs, 'appDeleting').and.callThrough();

        var p = that.deleteProject();
        $scope.$apply();
        expect(p.$$state.status).toBe(1);
        expect(cfApplicationTabs.appDeleting).toHaveBeenCalled();
      });

      it('#startWorkflow', function () {
        spyOn(that, 'reset');
        that.startWorkflow({
          cnsiGuid: 'cnsiGuid'
        });
        expect(that.reset).toHaveBeenCalled();
        expect(that.deletingApplication).toBe(true);
        expect(that.cnsiGuid).toBe('cnsiGuid');
        that.deletingApplication = false;
      });

      it('#stopWorkflow', function () {
        that.deletingApplication = true;
        that.stopWorkflow();
        expect(that.deletingApplication).toBe(false);
      });

      it('#finishWorkflow - success', function () {
        that.deleteApp = function () {
          return $q.resolve();
        };
        spyOn(that, 'deleteApp').and.callThrough();
        var p = that.finishWorkflow();
        $scope.$apply();

        expect(that.deleteApp).toHaveBeenCalled();
        expect(p.$$state.status).toBe(1);
      });

      it('#finishWorkflow - failure', function () {
        that.deleteApp = function () {
          return $q.reject();
        };
        spyOn(that, 'deleteApp').and.callThrough();
        var p = that.finishWorkflow();
        $scope.$apply();

        expect(that.deleteApp).toHaveBeenCalled();
        expect(p.$$state.status).toBe(2);
      });
    });
  });
  /* eslint-enable angular/no-private-call */
})();
