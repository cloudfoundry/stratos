(function () {
  'use strict';

  describe('Versions module', function () {

    var controller, $stateParams, $q, $timeout, $state, $scope, $httpBackend,
      $interpolate, modelManager, confirmDialog, utilsService, notificationsService;

    beforeEach(module('green-box-console'));
    beforeEach(module('cloud-foundry.view.applications.application.versions'));

    beforeEach(inject(function ($injector, _$q_, _$interpolate_, _$stateParams_, _$timeout_, _$state_) {
      // Create the parameters required by the ctor
      $stateParams = _$stateParams_;
      $stateParams.cnsiGuid = 'guid';
      $stateParams.guid = 'guid';
      $q = _$q_;
      $timeout = _$timeout_;
      $state = _$state_;
      $interpolate = _$interpolate_;
      $scope = $injector.get('$rootScope').$new();
      $httpBackend = $injector.get('$httpBackend');

      modelManager = $injector.get('modelManager');
      confirmDialog = function (specs) {
        return specs.callback();
      };
      notificationsService = {
        notify: angular.noop
      };
      utilsService = $injector.get('app.utils.utilsService');

      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      _.set(authModel, 'principal.guid.isAllowed.apply', _.noop);

      var listVersions = mock.cloudFoundryAPI.Versions.ListVersions('guid');
      $httpBackend.expectGET(listVersions.url).respond(listVersions.success.code, listVersions.success.response);
      createController();
      $httpBackend.flush();
    }));

    function createController() {
      var VersionsController = $state.get('cf.applications.application.versions').controller;
      controller = new VersionsController($q, $interpolate, $stateParams,
        $scope, $timeout, $state, modelManager,
        confirmDialog, notificationsService, utilsService);

    }

    afterEach(function () {
      // Not necessarily needed, but will catch any requests that have not been overwritten.
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('versions controller', function () {
      it('should be defined', function () {
        expect(controller).toBeDefined();
      });

      it('should have versions', function () {
        expect(controller.hasVersions()).toBeTruthy();
      });

    });

    describe('rollback test', function () {
      it('should be able to rollback', function () {
        $httpBackend.expectPUT('/pp/v1/proxy/v1/apps/guid/droplets/current').respond(201, {});
        var listVersions = mock.cloudFoundryAPI.Versions.ListVersions('guid');
        $httpBackend.expectGET(listVersions.url).respond(listVersions.success.code, listVersions.success.response);
        controller.rollback('testVersion');
        $httpBackend.flush();
      });

    });

  });
})();
