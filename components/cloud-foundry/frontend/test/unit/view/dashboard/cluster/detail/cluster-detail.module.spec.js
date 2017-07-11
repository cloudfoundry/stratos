(function () {
  'use strict';

  describe('cluster detail module', function () {

    var $controller, $httpBackend;

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    var clusterGuid = 'clusterGuid';

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var modelManager = $injector.get('modelManager');
      var apiManager = $injector.get('apiManager');
      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      var $scope = $injector.get('$rootScope').$new();
      var appUtilsService = $injector.get('appUtilsService');
      var $state = $injector.get('$state');
      var $q = $injector.get('$q');
      var modelUtils = $injector.get('modelUtils');
      var cfOrganizationModel = $injector.get('cfOrganizationModel');
      var appClusterCliCommands = $injector.get('appClusterCliCommands');
      var cfUtilsService = $injector.get('cfUtilsService');

      var consoleInfo = modelManager.retrieve('app.model.consoleInfo');
      _.set(consoleInfo, 'info.endpoints.cf.' + clusterGuid + '.user', {
        guid: 'user_guid',
        admin: true
      });

      var ClusterController = $state.get('endpoint.clusters.cluster.detail').controller;
      $controller = new ClusterController($stateParams, $scope, $state, $q, modelManager, apiManager,appUtilsService,
      appClusterCliCommands, modelUtils, cfOrganizationModel, cfUtilsService);

    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('initial state', function () {
      expect($controller).toBeDefined();
      expect($controller.guid).toEqual(clusterGuid);
      expect($controller.updateTotalApps).toBeDefined();
      expect($controller.initialized).toBeTruthy();
    });

  });

})();
