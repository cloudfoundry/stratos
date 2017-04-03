(function () {
  'use strict';

  describe('space detail (users) module', function () {

    var $controller, $httpBackend, $scope, authService, appEventEventService;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var $q = $injector.get('$q');
      var $state = $injector.get('$state');
      var utils = $injector.get('appUtilsUtilsService');
      var modelManager = $injector.get('modelManager');
      appEventEventService = $injector.get('appEventEventService');
      var appLoggedInLoggedInService = $injector.get('appLoggedInLoggedInService');

      authService = modelManager.retrieve('cloud-foundry.model.auth');
      spyOn(authService, 'initialize');

      $scope = $injector.get('$rootScope').$new();

      var ApplicationsController = $state.get('cf.applications').controller;
      $controller = new ApplicationsController($scope, $q, $state, utils, modelManager, appEventEventService, appLoggedInLoggedInService);

      expect($controller).toBeDefined();
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('init', function () {
      expect(authService.initialize).not.toHaveBeenCalled();

      appEventEventService.$emit(appEventEventService.events.LOGIN);
      $scope.$digest();

      expect(authService.initialize).toHaveBeenCalled();
    });

  });

})();
