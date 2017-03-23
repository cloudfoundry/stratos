(function () {
  'use strict';

  describe('cluster organization module', function () {

    var $controller, $httpBackend;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    var clusterGuid = 'clusterGuid';
    var organizationGuid = 'organizationGuid';

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var modelManager = $injector.get('app.model.modelManager');
      var utils = $injector.get('app.utils.utilsService');
      var organizationModel = $injector.get('organization-model');

      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      $stateParams.organization = organizationGuid;

      var $state = $injector.get('$state');
      var $q = $injector.get('$q');
      var $log = $injector.get('$log');

      var ClusterOrgController = $state.get('endpoint.clusters.cluster.organization').controller;
      $controller = new ClusterOrgController(modelManager, utils, organizationModel, $stateParams, $state, $q, $log);

    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('initial state', function () {
      $httpBackend.expectGET('/pp/v1/proxy/v2/organizations/organizationGuid/services?results-per-page=100')
        .respond({ resources: []});
      $httpBackend.flush();

      expect($controller).toBeDefined();

    });

  });

})();
