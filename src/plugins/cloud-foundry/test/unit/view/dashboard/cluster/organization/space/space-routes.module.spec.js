(function () {
  'use strict';

  describe('cluster space detail (routes) module', function () {

    var $controller, $httpBackend, $scope, $stateParams, $q, $state, modelManager, appClusterRoutesService, appUtilsService;

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    var clusterGuid = 'clusterGuid';
    var organizationGuid = 'organizationGuid';
    var spaceGuid = 'spaceGuid';
    var route = {
      metadata: {
        guid: 'routeGuid'
      },
      entity: {
        host: 'www.foo.com',
        apps: []
      }
    };
    var space = {
      routes: [route],
      details: {
        space: {
          metadata: {
            guid: spaceGuid
          }
        }
      }
    };

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      $scope = $injector.get('$rootScope').$new();
      $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      $stateParams.organization = organizationGuid;
      $stateParams.space = spaceGuid;
      $q = $injector.get('$q');
      $state = $injector.get('$state');
      modelManager = $injector.get('modelManager');
      appClusterRoutesService = $injector.get('appClusterRoutesService');
      appUtilsService = $injector.get('appUtilsService');

      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      _.set(authModel, 'principal.' + clusterGuid + '.isAllowed.apply', _.noop);

    }));

    function createController(space) {
      var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
      _.set(spaceModel, 'spaces.' + clusterGuid + '.' + spaceGuid, space);

      var SpaceRoutesController = $state.get('endpoint.clusters.cluster.organization.space.detail.routes').controller;
      $controller = new SpaceRoutesController($scope, $stateParams, $q, $state, modelManager, appClusterRoutesService, appUtilsService);
    }

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('initial state - fetch routes', function () {
      createController({});
      $httpBackend.expectGET('/pp/v1/proxy/v2/spaces/' + spaceGuid + '/routes?include-relations=domain,apps&inline-relations-depth=1&results-per-page=100')
        .respond({
          resources: [route]
        });
      $httpBackend.flush();

      expect($controller).toBeDefined();
      expect($controller.appClusterRoutesService).toBeDefined();
      expect($controller.visibleRoutes).toBeDefined();
      expect($controller.actionsPerRoute).toBeDefined();
      expect($controller.canDeleteOrUnmap).toBeDefined();
      expect($controller.appsToNames).toBeDefined();
      expect($controller.spaceDetail).toBeDefined();
    });

    it('initial state - cached routes', function () {
      createController(space);
    });

    it('update actions', function () {
      createController(space);
      $controller.visibleRoutes = [ route ];
      $scope.$digest();

    });

  });

})();
