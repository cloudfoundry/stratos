(function () {
  'use strict';

  describe('application module', function () {
    var $httpBackend, controller;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
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

      var ApplicationController = $state.get('cf.applications.application').controller;
      controller = new ApplicationController(modelManager, eventService, confirmDialogMock,
        utils, cliCommands, $stateParams, $scope, $window, $q, $interval, $interpolate, $state);
      $httpBackend.flush();
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

      it('should have all actions enabled', function () {
        // Set state action
        var actions = ['start', 'stop', 'restart', 'delete'];
        _.each(actions, function (actionId) {
          controller.model.application.state.actions[actionId] = true;
          expect(controller.isActionHidden(actionId)).toBe(false);
        });
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

      it('should have all actions disabled', function () {
        // Set state action
        var actions = ['start', 'stop', 'restart', 'delete'];
        _.each(actions, function (actionId) {
          controller.model.application.state.actions[actionId] = true;
          expect(controller.isActionHidden(actionId)).toBe(true);
        });
      });
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

      it('should have all actions enabled', function () {
        // Set state action
        var actions = ['start', 'stop', 'restart', 'delete'];
        _.each(actions, function (actionId) {
          controller.model.application.state.actions[actionId] = true;
          expect(controller.isActionHidden(actionId)).toBe(false);
        });
      });
    });
  });
})();
