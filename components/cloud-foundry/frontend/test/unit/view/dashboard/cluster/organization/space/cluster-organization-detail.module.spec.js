(function () {
  'use strict';

  describe('cluster organization detail module', function () {

    var $controller, $httpBackend;

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    var clusterGuid = 'clusterGuid';
    var organizationGuid = 'organizationGuid';

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var appUtilsService = $injector.get('appUtilsService');
      var cfOrganizationModel = $injector.get('cfOrganizationModel');
      var cfTabs = $injector.get('cfTabs');

      var $state = $injector.get('$state');
      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      $stateParams.organization = organizationGuid;
      var $q = $injector.get('$q');

      var ClusterOrgDetailController = $state.get('endpoint.clusters.cluster.organization.detail').controller;
      $controller = new ClusterOrgDetailController(appUtilsService, cfOrganizationModel, cfTabs, $state, $stateParams, $q);
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
