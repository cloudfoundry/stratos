(function () {
  'use strict';

  describe('application module', function () {
    var $httpBackend, controller, $interval, detailViewMock;

    var mocks = {};

    beforeEach(module('templates'));
    angular.module('interval', []).factory('$interval', function () {
      $interval = jasmine.createSpy().and.callFake(function (callback) {
        callback();
        return 'interval_created';
      });
      $interval.cancel = jasmine.createSpy();
      mocks.$interval = $interval;
      return $interval;
    });

    beforeEach(module('green-box-console', 'interval'));
    var userGuid = 'guid';
    var cnsiGuid = 'cnsiGuid';
    var appGuid = 'appGuid';
    var spaceGuid = 'spaceGuid';

    function initController($injector, role) {
      $httpBackend = $injector.get('$httpBackend');

      var modelManager = $injector.get('app.model.modelManager');
      var eventService = $injector.get('app.event.eventService');
      var utils = $injector.get('app.utils.utilsService');
      var cliCommands = $injector.get('cloud-foundry.view.applications.application.summary.cliCommands');

      var $scope = $injector.get('$rootScope').$new();

      var $stateParams = $injector.get('$stateParams');
      $stateParams.cnsiGuid = cnsiGuid;
      $stateParams.guid = appGuid;
      var $window = $injector.get('$window');
      var $q = $injector.get('$q');
      var $interval = $injector.get('$interval');
      var $interpolate = $injector.get('$interpolate');
      var $state = $injector.get('$state');
      var confirmDialogMock = function (dialogSpecs) {
        dialogSpecs.callback();
      };
      detailViewMock = jasmine.createSpy('detailView');

      var authModelOpts = {
        role: role,
        userGuid: userGuid,
        cnsiGuid: cnsiGuid,
        spaceGuid: spaceGuid
      };
      mock.cloudFoundryModel.Auth.initAuthModel($injector, authModelOpts);

      var registeredList = mock.UserServiceInstanceApi.list(cnsiGuid);
      $httpBackend.whenGET(registeredList.url).respond(200, registeredList.response['200'].body);

      var versionsRequest = mock.cloudFoundryAPI.Versions.ListVersions(appGuid);
      $httpBackend.whenGET(versionsRequest.url).respond(200, versionsRequest.success.code, versionsRequest.success.response);

      var retrieveApp = mock.cloudFoundryAPI.Apps.RetrieveApp(appGuid);
      $httpBackend.whenGET(retrieveApp.url).respond(200, retrieveApp.response['200'].body);

      var appSummary = mock.cloudFoundryAPI.Apps.GetAppSummary(appGuid, spaceGuid);
      $httpBackend.whenGET(appSummary.url).respond(200, appSummary.response['200'].body);

      var infoRequest = mock.cloudFoundryAPI.Info.GetInfo(cnsiGuid);
      $httpBackend.whenGET(infoRequest.url).respond(200, infoRequest.response['200'].body);

      var hceInfoRequest = mock.hceApi.HceInfoApi.info(cnsiGuid);
      $httpBackend.whenGET(hceInfoRequest.url).respond(200, hceInfoRequest.response['200'].body);

      var userProvidedServiceRequest = mock.hceApi.UserProvidedServiceInstancesApi.RetrieveUserProvidedServiceInstance(appGuid);
      $httpBackend.whenGET(userProvidedServiceRequest.url).respond(200, userProvidedServiceRequest.response['200']);

      var ApplicationController = $state.get('cf.applications.application').controller;
      controller = new ApplicationController(modelManager, eventService, confirmDialogMock,
        utils, cliCommands, detailViewMock, $stateParams, $scope, $window, $q, $interval, $interpolate, $state);
      $httpBackend.flush();
    }

    function allActionsHidden(hidden) {
      var actions = ['start', 'stop', 'restart', 'delete'];
      _.each(actions, function (actionId) {
        // Set state action
        controller.model.application.state.actions[actionId] = true;
        expect(controller.isActionHidden(actionId)).toBe(hidden);
      });
    }

    function allActionsHiddenExcludingDelete(hidden) {
      controller.model.application.pipeline.forbidden = true;
      var actions = ['start', 'stop', 'restart'];
      _.each(actions, function (actionId) {
        // Set state action
        controller.model.application.state.actions[actionId] = true;
        expect(controller.isActionHidden(actionId)).toBe(hidden);
      });
      controller.model.application.state.actions.delete = true;
      expect(controller.isActionHidden('delete')).toBe(true);
    }

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('admin user', function () {

      beforeEach(inject(function ($injector, _$state_) {
        initController($injector, 'admin', _$state_);
      }));

      it('init', function () {
        expect(controller).toBeDefined();
      });

      it('should have variables section enabled', function () {
        expect(controller.hideVariables).toBe(false);
      });

      it('should have all actions enabled', _.partial(allActionsHidden, false));

      it('should have all actions enabled except delete', _.partial(allActionsHiddenExcludingDelete, false));

      it('should be able to view view application', function () {

        var calledUrl;
        var expectedUrl = 'http://host-20.domain-48.example.com/';
        spyOn(controller.$window, 'open').and.callFake(function (url) {
          calledUrl = url;
        });

        var viewAction = controller.appActions[0];
        viewAction.execute();
        expect(controller.$window.open).toHaveBeenCalled();
        expect(calledUrl).toEqual(expectedUrl);
      });

      it('should be able to execute stop action', function () {
        var updateApp = mock.cloudFoundryAPI.Apps.UpdateApp(appGuid, {name: 'nodeenv', state: 'STOPPED'});
        $httpBackend.expectPUT(updateApp.url).respond(201, updateApp.response['201'].body);
        var stopAction = controller.appActions[1];
        stopAction.execute();
        $httpBackend.flush();
      });

      it('should be able to execute restart action', function () {
        var stopApp = mock.cloudFoundryAPI.Apps.UpdateApp(appGuid, {name: 'nodeenv', state: 'STOPPED'});
        $httpBackend.expectPUT(stopApp.url).respond(201, stopApp.response['201'].body);

        var startApp = mock.cloudFoundryAPI.Apps.UpdateApp(appGuid, {name: 'nodeenv', state: 'STARTED'});
        $httpBackend.expectPUT(startApp.url).respond(201, startApp.response['201'].body);

        var statCall = mock.cloudFoundryAPI.Apps.GetDetailedStatsForStartedApp(appGuid);
        $httpBackend.whenGET(statCall.url).respond(200, statCall.response['200'].body);
        var stopAction = controller.appActions[2];
        stopAction.execute();
        $httpBackend.flush();
      });

      it('should be able to execute delete action', function () {
        var deleteAction = controller.appActions[3];
        deleteAction.execute();
        expect(detailViewMock).toHaveBeenCalled();
      });

      it('should be able to start app', function () {
        var startApp = mock.cloudFoundryAPI.Apps.UpdateApp(appGuid, {name: 'nodeenv', state: 'STARTED'});
        $httpBackend.expectPUT(startApp.url).respond(201, startApp.response['201'].body);

        var statCall = mock.cloudFoundryAPI.Apps.GetDetailedStatsForStartedApp(appGuid);
        $httpBackend.whenGET(statCall.url).respond(200, statCall.response['200'].body);
        var startAction = controller.appActions[4];
        startAction.execute();
        $httpBackend.flush();
      });

      it('should be able to view CLI instructions', function () {

        spyOn(controller.cliCommands, 'show').and.callThrough();

        var startAction = controller.appActions[5];
        startAction.execute();
        expect(controller.cliCommands.show).toHaveBeenCalled();

      });

      it('should stop polling when a modal interaction starts', function () {
        controller.eventService.$emit(controller.eventService.events.MODAL_INTERACTION_START);
        expect(_.isUndefined(controller.scheduledUpdate)).toBe(true);
      });

      it('should resume polling when a modal interaction starts', function () {
        controller.eventService.$emit(controller.eventService.events.MODAL_INTERACTION_END);
        $httpBackend.flush();
        expect(controller.scheduledUpdate).toBe('interval_created');
      });
    });

    describe('non dev user', function () {

      beforeEach(inject(function ($injector, _$state_) {
        initController($injector, 'space_manager', _$state_);
      }));

      it('init', function () {
        expect(controller).toBeDefined();
      });

      it('should have variables section disabled', function () {
        expect(controller.hideVariables).toBe(true);
      });

      it('should have delivery pipeline section disabled', function () {
        expect(controller.hideDeliveryPipelineData).toBe(true);
      });

      it('should have all actions disabled', _.partial(allActionsHidden, true));

      it('should have all actions disabled except delete', _.partial(allActionsHiddenExcludingDelete, true));
    });

    describe('dev user', function () {

      beforeEach(inject(function ($injector, _$state_) {
        initController($injector, 'space_developer', _$state_);
      }));

      it('init', function () {
        expect(controller).toBeDefined();
      });

      it('should have variables section disabled', function () {
        expect(controller.hideVariables).toBe(false);
      });

      it('should have delivery pipeline section disabled', function () {
        expect(controller.hideDeliveryPipelineData).toBe(false);
      });

      it('should have all actions enabled', _.partial(allActionsHidden, false));

      it('should have all actions enabled except delete', _.partial(allActionsHiddenExcludingDelete, false));
    });
  });
})();
