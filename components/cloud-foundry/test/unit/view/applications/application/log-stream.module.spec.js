(function () {
  'use strict';

  describe('app details - cf log view', function () {
    var $httpBackend, appLogStreamController;

    beforeEach(module('console-app'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var $stateParams = $injector.get('$stateParams');
      var $location = $injector.get('$location');
      var $state = $injector.get('$state');

      $stateParams.guid = 'appGuid';
      $stateParams.cnsiGuid = 'cnsiGuid';

      var ApplicationLogStreamController = $state.get('cf.applications.application.log-stream').controller;
      appLogStreamController = new ApplicationLogStreamController($stateParams, $location);
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should have controller defined', function () {
      expect(appLogStreamController).toBeDefined();
    });

    it('should have valid WebsocketUrl', function () {
      expect(appLogStreamController.webSocketUrl).toBe('ws://server:80/pp/v1/cnsiGuid/apps/appGuid/stream');
    });

  });

})();
