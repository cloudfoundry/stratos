(function () {
  'use strict';

  describe('app details - services view', function () {
    var $httpBackend, $scope, appServicesCtrl;

    beforeEach(module('console-app'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $scope = $injector.get('$rootScope').$new();
      var modelManager = $injector.get('modelManager');
      var $stateParams = $injector.get('$stateParams');
      var $state = $injector.get('$state');

      $stateParams.guid = 'app_123';
      $stateParams.cnsiGuid = 'guid';

      var ApplicationServicesController = $state.get('cf.applications.application.services').controller;
      appServicesCtrl = new ApplicationServicesController($scope, modelManager, $stateParams);
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should have controller defined', function () {
      expect(appServicesCtrl).toBeDefined();
      expect(appServicesCtrl.model).toBeDefined();
      expect(appServicesCtrl.appModel).toBeDefined();
    });

    it('should have IDs and services initially defined', function () {
      expect(appServicesCtrl.id).toBe('app_123');
      expect(appServicesCtrl.cnsiGuid).toBe('guid');
      expect(appServicesCtrl.services).toEqual([]);
    });

    it('should keep services empty on app summary change with no space GUID', function () {
      appServicesCtrl.appModel.application.summary = {
        guid: 'app_123'
      };

      $scope.$apply();

      expect(appServicesCtrl.services.length).toBe(0);
    });

  });

})();
