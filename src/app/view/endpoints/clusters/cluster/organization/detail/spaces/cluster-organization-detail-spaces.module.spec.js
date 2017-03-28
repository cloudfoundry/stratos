(function () {
  'use strict';

  describe('cluster organization detail (spaces) module', function () {

    var $controller, $httpBackend;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    var clusterGuid = 'clusterGuid';
    var organizationGuid = 'organizationGuid';

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var $q = $injector.get('$q');
      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      $stateParams.organization = organizationGuid;
      var $state = $injector.get('$state');
      var modelManager = $injector.get('modelManager');
      var utils = $injector.get('app.utils.utilsService');

      var ClusterDetailSpacesController = $state.get('endpoint.clusters.cluster.organization.detail.spaces').controller;
      $controller = new ClusterDetailSpacesController($q, $stateParams, $state, modelManager, utils);
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('initial state', function () {
      expect($controller).toBeDefined();
      expect($controller.stateInitialised).toBeTruthy();
    });

  });

})();
