(function () {
  'use strict';

  /* eslint-disable angular/no-private-call */
  describe('add-service-workflow directive - ', function () {
    var $httpBackend, $scope, eventService, that;
    var appGuid = 'app_123';

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      var $compile = $injector.get('$compile');
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      eventService = $injector.get('app.event.eventService');

      var markup = '<delete-app-workflow></delete-app-workflow>';
      var element = angular.element(markup);
      $compile(element)($scope);
      $scope.$apply();

      that = element.controller('deleteAppWorkflow');
      var mockAppsApi = mock.cloudFoundryAPI.Apps;
      var GetAppSummary = mockAppsApi.GetAppSummary(appGuid);
      that.appModel.application = {
        summary: GetAppSummary.response['200'].body
      };
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be compilable', function () {
      expect(that).toBeDefined();
    });

    it('should listen on cf.events.START_DELETE_APP_WORKFLOW', function () {
      spyOn(that, 'startWorkflow');
      eventService.$emit('cf.events.START_DELETE_APP_WORKFLOW', 'foo');
      expect(that.startWorkflow).toHaveBeenCalledWith('foo');
    });

    describe('after resetting', function () {
      beforeEach(function () {
        that.reset();
      });

      it('should be set properly', function () {
        expect(that.cnsiGuid).toBe(null);
        expect(that.hceCnsiGuid).toBe(null);
        expect(that.data).toBeDefined();
        expect(that.userInput.checkedRouteValue).toBeDefined();
        expect(that.userInput.checkedServiceValue).toBeDefined();
        expect(that.data.workflow).toBeDefined();
        expect(that.options).toEqual({
          workflow: that.data.workflow,
          userInput: that.userInput,
          appModel: that.appModel,
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
          return that.$q.resolve();
        };
        spyOn(that, 'checkAppRoutes').and.callThrough();
        var deferred = that.$q.defer();
        var wizard = {
          postInitTask: deferred
        };
        deferred.resolve();

        that.data.workflow.initControllers(wizard);
        $scope.$apply();
        expect(that.options.isBusy).toBe(false);
        expect(that.wizard.nextBtnDisabled).toBe(false);
      });

      it('deleteApplicationActions - stop', function () {
        spyOn(that, 'stopWorkflow');
        that.deleteApplicationActions.stop();
        expect(that.stopWorkflow).toHaveBeenCalled();
      });

      it('deleteApplicationActions - finish', function () {
        that.finishWorkflow = function () {
          return that.$q.reject();
        };
        spyOn(that, 'finishWorkflow').and.callThrough();
        that.deleteApplicationActions.finish({
          disableButtons: function () {},
          resetButtons: function () {}
        });
        expect(that.finishWorkflow).toHaveBeenCalled();
      });

      it('#checkAppRoutes', function () {
        var routeGuid = '84a911b3-16f7-4f47-afa4-581c86018600';
        var ListAllAppsForRoute = mock.cloudFoundryAPI.Routes.ListAllAppsForRoute(routeGuid);
        $httpBackend.whenGET(ListAllAppsForRoute.url + '?results-per-page=1').respond(ListAllAppsForRoute.response[200].body);
        $httpBackend.expectGET(ListAllAppsForRoute.url + '?results-per-page=1');
        expect(that.options.safeRoutes.length).toBe(0);
        that.checkAppRoutes();
        $httpBackend.flush();
        expect(that.options.safeRoutes.length).toBeGreaterThan(0);
      });

      it('#checkAppRoutes - multi-binding', function () {
        var routeGuid = '84a911b3-16f7-4f47-afa4-581c86018600';
        var ListAllAppsForRoute = mock.cloudFoundryAPI.Routes.ListAllAppsForRoute(routeGuid);
        $httpBackend.whenGET(ListAllAppsForRoute.url + '?results-per-page=1').respond(angular.extend({}, ListAllAppsForRoute.response[200].body, {
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
        that.removeAppFromRoutes = function () { return that.$q.resolve(); };
        that.tryDeleteEachRoute = function () { return that.$q.resolve(); };
        that.deleteServiceBindings = function () { return that.$q.resolve(); };
        that.deleteProject = function () { return that.$q.resolve(); };
        that.appModel.deleteApp = function () { return that.$q.resolve(); };
        spyOn(that, 'removeAppFromRoutes').and.callThrough();
        spyOn(that, 'tryDeleteEachRoute').and.callThrough();
        spyOn(that, 'deleteServiceBindings').and.callThrough();
        spyOn(that, 'deleteProject').and.callThrough();
        spyOn(that.appModel, 'deleteApp').and.callThrough();

        that.deleteApp();
        $scope.$apply();

        expect(that.removeAppFromRoutes).toHaveBeenCalled();
        expect(that.tryDeleteEachRoute).toHaveBeenCalled();
        expect(that.deleteServiceBindings).toHaveBeenCalled();
        expect(that.deleteProject).toHaveBeenCalled();
        expect(that.appModel.deleteApp).toHaveBeenCalled();
      });

      it('#removeAppFromRoutes', function () {
        var routeGuid = '84a911b3-16f7-4f47-afa4-581c86018600';
        var RemoveAppFromRoute = mock.cloudFoundryAPI.Routes.RemoveAppFromRoute(routeGuid, appGuid);
        $httpBackend.whenDELETE(RemoveAppFromRoute.url).respond(RemoveAppFromRoute.response[204].body);
        $httpBackend.expectDELETE(RemoveAppFromRoute.url);
        spyOn(that.routeModel, 'removeAppFromRoute').and.callThrough();
        var numCheckedRoutes = Object.keys(that.userInput.checkedRouteValue).length;

        that.removeAppFromRoutes();
        $httpBackend.flush();

        expect(that.routeModel.removeAppFromRoute).toHaveBeenCalledTimes(numCheckedRoutes);
      });

      it('#deleteServiceBindings - no services checked', function () {
        that.userInput.checkedServiceValue = {};
        spyOn(that, '_unbindServiceInstances');

        that.deleteServiceBindings();
        $scope.$apply();

        expect(that._unbindServiceInstances).not.toHaveBeenCalled();
      });

      it('#deleteServiceBindings - has services checked', function () {
        that._unbindServiceInstances = function () { return that.$q.resolve(); };
        spyOn(that, '_unbindServiceInstances').and.callThrough();
        spyOn(that, '_deleteServiceInstances');

        that.deleteServiceBindings();
        $scope.$apply();

        expect(that._unbindServiceInstances).toHaveBeenCalled();
        expect(that._deleteServiceInstances).toHaveBeenCalled();
      });

      it('#_unbindServiceInstances', function () {
        var bindingGuids = ['28aa8270-ab0e-480d-b9b6-ba4ec4f15015'];
        var ListAllServiceBindingsForApp = mock.cloudFoundryAPI.Apps.ListAllServiceBindingsForApp(appGuid);
        var queryString = '?q=service_instance_guid+IN+28aa8270-ab0e-480d-b9b6-ba4ec4f15015&results-per-page=100';
        $httpBackend.whenGET(ListAllServiceBindingsForApp.url + queryString).respond(ListAllServiceBindingsForApp.response[200].body);
        $httpBackend.expectGET(ListAllServiceBindingsForApp.url + queryString);

        that.appModel.unbindServiceFromApp = function () { return that.$q.resolve(); };
        spyOn(that.appModel, 'unbindServiceFromApp').and.callThrough();

        that._unbindServiceInstances(bindingGuids);
        $httpBackend.flush();

        expect(that.appModel.unbindServiceFromApp).toHaveBeenCalledTimes(1);
      });

      it('#_deleteServiceInstances', function () {
        var safeServiceInstances = ['1', '2', '3'];
        that._deleteServiceInstanceIfPossible = function () { return that.$q.resolve(); };
        spyOn(that, '_deleteServiceInstanceIfPossible').and.callThrough();

        that._deleteServiceInstances(safeServiceInstances);
        $scope.$apply();

        expect(that._deleteServiceInstanceIfPossible).toHaveBeenCalledTimes(safeServiceInstances.length);
      });

      it('#_deleteServiceInstanceIfPossible - success', function () {
        that.serviceInstanceModel.deleteServiceInstance = function () { return that.$q.resolve(); };
        spyOn(that.serviceInstanceModel, 'deleteServiceInstance').and.callThrough();

        var p = that._deleteServiceInstanceIfPossible('123');
        $scope.$apply();

        expect(that.serviceInstanceModel.deleteServiceInstance).toHaveBeenCalledTimes(1);
        expect(p.$$state.status).toBe(1);
      });

      it('#_deleteServiceInstanceIfPossible - failure with error AssociationNotEmpty', function () {
        that.serviceInstanceModel.deleteServiceInstance = function () {
          return that.$q.reject({
            data: {
              error_code: 'CF-AssociationNotEmpty'
            }
          });
        };
        spyOn(that.serviceInstanceModel, 'deleteServiceInstance').and.callThrough();

        var p = that._deleteServiceInstanceIfPossible('123');
        $scope.$apply();

        expect(p.$$state.status).toBe(1);
      });

      it('#_deleteServiceInstanceIfPossible - failure wihout error', function () {
        that.serviceInstanceModel.deleteServiceInstance = function () {
          return that.$q.reject({
            data: {
            }
          });
        };
        spyOn(that.serviceInstanceModel, 'deleteServiceInstance').and.callThrough();

        var p = that._deleteServiceInstanceIfPossible('123');
        $scope.$apply();

        expect(p.$$state.status).toBe(2);
      });

      it('#deleteRouteIfPossible - do not delete', function () {
        var routeId = 'foo';
        that.routeModel.listAllAppsForRouteWithoutStore = function () {
          return that.$q.resolve({
            total_results: 1
          });
        };
        spyOn(that.routeModel, 'listAllAppsForRouteWithoutStore').and.callThrough();

        that.deleteRouteIfPossible(routeId);
        $scope.$apply();

        expect(that.routeModel.listAllAppsForRouteWithoutStore).toHaveBeenCalled();
      });

      it('#deleteRouteIfPossible', function () {
        var routeId = 'foo';
        that.routeModel.listAllAppsForRouteWithoutStore = function () {
          return that.$q.resolve({
            total_results: 0
          });
        };
        that.routeModel.deleteRoute = function () {
          return that.$q.resolve();
        };

        spyOn(that.routeModel, 'listAllAppsForRouteWithoutStore').and.callThrough();
        spyOn(that.routeModel, 'deleteRoute').and.callThrough();

        that.deleteRouteIfPossible(routeId);
        $scope.$apply();

        expect(that.routeModel.listAllAppsForRouteWithoutStore).toHaveBeenCalled();
        expect(that.routeModel.deleteRoute).toHaveBeenCalled();
      });

      it('#tryDeleteEachRoute', function () {
        that.userInput.checkedRouteValue = {
          foo: { value: 'foo' },
          bar: { value: 'bar' }
        };
        var length = Object.keys(that.userInput.checkedRouteValue).length;

        that.deleteRouteIfPossible = function () {
          return that.$q.resolve();
        };
        spyOn(that, 'deleteRouteIfPossible').and.callThrough();

        that.tryDeleteEachRoute();
        $scope.$apply();

        expect(that.deleteRouteIfPossible).toHaveBeenCalledTimes(length);
      });

      it('#deleteProject - project is defined', function () {
        that.appModel.application.project = undefined;
        spyOn(that.hceModel, 'removeProject').and.callThrough();
        var p = that.deleteProject();
        $scope.$apply();
        expect(p.$$state.status).toBe(1);
        expect(that.hceModel.removeProject).not.toHaveBeenCalled();
      });

      it('#deleteProject - project is not defined', function () {
        that.appModel.application.project = {};
        that.hceModel.removeProject = function () {
          return that.$q.resolve();
        };
        spyOn(that.hceModel, 'removeProject').and.callThrough();

        var p = that.deleteProject();
        $scope.$apply();
        expect(p.$$state.status).toBe(1);
        expect(that.hceModel.removeProject).toHaveBeenCalled();
      });

      it('#startWorkflow', function () {
        spyOn(that, 'reset');
        that.startWorkflow({
          cnsiGuid: 'cnsiGuid', hceCnsiGuid: 'hceCnsiGuid'
        });
        expect(that.reset).toHaveBeenCalled();
        expect(that.deletingApplication).toBe(true);
        expect(that.cnsiGuid).toBe('cnsiGuid');
        expect(that.hceCnsiGuid).toBe('hceCnsiGuid');
        that.deletingApplication = false;
      });

      it('#stopWorkflow', function () {
        that.deletingApplication = true;
        that.stopWorkflow();
        expect(that.deletingApplication).toBe(false);
      });

      it('#finishWorkflow - success', function () {
        that.deleteApp = function () {
          return that.$q.resolve();
        };
        spyOn(that, 'deleteApp').and.callThrough();
        var p = that.finishWorkflow();
        $scope.$apply();

        expect(that.deleteApp).toHaveBeenCalled();
        expect(p.$$state.status).toBe(1);
      });

      it('#finishWorkflow - failure', function () {
        that.deleteApp = function () {
          return that.$q.reject();
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
