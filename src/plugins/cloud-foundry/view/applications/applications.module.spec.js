(function () {
  'use strict';

  describe('space detail (users) module', function () {

    var $controller, $httpBackend, $scope, authService, eventService;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var $q = $injector.get('$q');
      var $state = $injector.get('$state');
      var utils = $injector.get('app.utils.utilsService');
      var modelManager = $injector.get('app.model.modelManager');
      eventService = $injector.get('app.event.eventService');
      var loggedInService = $injector.get('app.logged-in.loggedInService');

      authService = modelManager.retrieve('cloud-foundry.model.auth');
      spyOn(authService, 'initialize');

      $scope = $injector.get('$rootScope').$new();

      var ApplicationsController = $state.get('cf.applications').controller;
      $controller = new ApplicationsController($q, $state, utils, modelManager, eventService, loggedInService);

      expect($controller).toBeDefined();
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('init', function () {
      expect(authService.initialize).not.toHaveBeenCalled();

      eventService.$emit(eventService.events.LOGIN);
      $scope.$digest();

      expect(authService.initialize).toHaveBeenCalled();
    });

  });

})();
