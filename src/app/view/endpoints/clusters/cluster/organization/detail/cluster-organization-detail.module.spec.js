(function () {
  'use strict';

  describe('cluster organization detail module', function () {

    var $controller, $httpBackend;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    var clusterGuid = 'clusterGuid';
    var organizationGuid = 'organizationGuid';

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var modelManager = $injector.get('app.model.modelManager');
      var $state = $injector.get('$state');
      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      $stateParams.organization = organizationGuid;
      var $q = $injector.get('$q');
      var utils = $injector.get('app.utils.utilsService');

      var ClusterOrgDetailController = $state.get('endpoint.clusters.cluster.organization.detail').controller;
      $controller = new ClusterOrgDetailController(modelManager, $state, $stateParams, $q, utils);
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('initial state', function () {
      expect($controller).toBeDefined();

    });

  });

})();
