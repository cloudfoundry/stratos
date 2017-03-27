(function () {
  'use strict';

  describe('cluster module', function () {

    var $controller, $httpBackend;
    // var $http, stackatoInfoService;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    var clusterGuid = 'clusterGuid';

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      var $log = $injector.get('$log');
      var utils = $injector.get('app.utils.utilsService');
      var $state = $injector.get('$state');
      var $q = $injector.get('$q');
      var rolesService = $injector.get('app.view.endpoints.clusters.cluster.rolesService');
      var modelManager = $injector.get('modelManager');
      var userSelection = $injector.get('app.view.userSelection');
      var organizationModel = $injector.get('organization-model');

      var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
      _.set(stackatoInfo, 'info.endpoints.hcf.' + clusterGuid + '.user', {
        guid: 'user_guid',
        admin: true
      });

      var ClusterController = $state.get('endpoint.clusters.cluster').controller;
      $controller = new ClusterController($stateParams, $log, utils, $state, $q, rolesService, modelManager, userSelection, organizationModel);

    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    function standardRequests() {
      // Basic set of required responses. Optional to allow future testing to customise responses

      // Basic response to org model listAllOrganizations
      var ListAllOrganizations = mock.cloudFoundryAPI.Organizations.ListAllOrganizations('cluster_set_1');
      $httpBackend.expectGET(ListAllOrganizations.url).respond(ListAllOrganizations.response['200'].body);

      // User services list
      $httpBackend.expectGET('/pp/v1/cnsis/registered').respond([]);

      // auth.model init for endpoint
      $httpBackend.expectGET('/pp/v1/proxy/v2/config/feature_flags').respond([]);
      $httpBackend.expectGET('/pp/v1/proxy/v2/users/user_guid/summary').respond({
        entity: {
          audited_organizations: []
        }
      });

      // list all users
      $httpBackend.expectGET('/pp/v1/proxy/v2/users?results-per-page=100').respond({ resources: []});
    }

    it('initial state', function () {
      standardRequests();

      expect($controller).toBeDefined();
      expect($controller.initialized).toBeFalsy();
      expect($controller.guid).toEqual(clusterGuid);
      expect($controller.getEndpoint).toBeDefined();

      $httpBackend.flush();

      expect($controller.initialized).toBeTruthy();

    });

  });

})();
