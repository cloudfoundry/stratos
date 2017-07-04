(function () {
  'use strict';

  describe('space detail (users) module', function () {

    var $controller, $httpBackend, $scope, authService, appEventService;

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var $q = $injector.get('$q');
      var $state = $injector.get('$state');
      var appUtilsService = $injector.get('appUtilsService');
      var modelManager = $injector.get('modelManager');
      appEventService = $injector.get('appEventService');
      var appLoggedInService = $injector.get('appLoggedInService');

      authService = modelManager.retrieve('cloud-foundry.model.auth');
      spyOn(authService, 'initialize');

      $scope = $injector.get('$rootScope').$new();

      var ApplicationsController = $state.get('cf.applications').controller;
      $controller = new ApplicationsController($scope, $q, $state, appUtilsService, modelManager, appEventService, appLoggedInService);

      expect($controller).toBeDefined();
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('init', function () {
      expect(authService.initialize).not.toHaveBeenCalled();

      appEventService.$emit(appEventService.events.LOGIN);
      $scope.$digest();

      expect(authService.initialize).toHaveBeenCalled();
    });

  });

})();
