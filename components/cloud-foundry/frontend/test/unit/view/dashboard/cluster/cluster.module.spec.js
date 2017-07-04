(function () {
  'use strict';

  describe('cluster module', function () {

    var $controller, $httpBackend;
    // var $http, consoleInfoService;

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    var clusterGuid = 'clusterGuid';

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      var $log = $injector.get('$log');
      var appUtilsService = $injector.get('appUtilsService');
      var $state = $injector.get('$state');
      var $q = $injector.get('$q');
      var appClusterRolesService = $injector.get('appClusterRolesService');
      var modelManager = $injector.get('modelManager');
      var appUserSelection = $injector.get('appUserSelection');
      var cfOrganizationModel = $injector.get('cfOrganizationModel');

      var consoleInfo = modelManager.retrieve('app.model.consoleInfo');
      _.set(consoleInfo, 'info.endpoints.cf.' + clusterGuid + '.user', {
        guid: 'user_guid',
        admin: true
      });

      var ClusterController = $state.get('endpoint.clusters.cluster').controller;
      $controller = new ClusterController($stateParams, $log, appUtilsService, $state, $q, appClusterRolesService, modelManager, appUserSelection, cfOrganizationModel);

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

      // User services list
      $httpBackend.expectGET('/pp/v1/cnsis/registered').respond([]);
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
