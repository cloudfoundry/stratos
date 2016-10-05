(function () {
  'use strict';

  describe('cluster space detail module', function () {

    var $controller, $httpBackend;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    var clusterGuid = 'clusterGuid';
    var organizationGuid = 'organizationGuid';
    var spaceGuid = 'spaceGuid';

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var modelManager = $injector.get('app.model.modelManager');
      var $state = $injector.get('$state');
      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      $stateParams.organization = organizationGuid;
      $stateParams.space = spaceGuid;

      var $q = $injector.get('$q');
      var utils = $injector.get('app.utils.utilsService');

      var ClusterSpaceController = $state.get('endpoint.clusters.cluster.organization.space.detail').controller;
      $controller = new ClusterSpaceController($q, $state, $stateParams, modelManager, utils);
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('initial state', function () {
      expect($controller).toBeDefined();
      expect($controller.space).toBeDefined();
      expect($controller.stateInitialised).toBeTruthy();
    });

  });

})();
