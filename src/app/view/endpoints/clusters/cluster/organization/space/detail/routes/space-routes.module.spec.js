(function () {
  'use strict';

  describe('cluster space detail (routes) module', function () {

    var $controller, $httpBackend, $scope, $stateParams, $q, $log, $state, modelManager, routesService, utils;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    var clusterGuid = 'clusterGuid';
    var organizationGuid = 'organizationGuid';
    var spaceGuid = 'spaceGuid';
    var route = {
      metadata: {
        guid: 'routeGuid'
      },
      entity: {
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
      $log = $injector.get('$log');
      $state = $injector.get('$state');
      modelManager = $injector.get('app.model.modelManager');
      routesService = $injector.get('app.view.endpoints.clusters.routesService');
      utils = $injector.get('app.utils.utilsService');

      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      _.set(authModel, 'principal.' + clusterGuid + '.isAllowed.apply', _.noop);

    }));

    function createController(space) {
      var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
      _.set(spaceModel, 'spaces.' + clusterGuid + '.' + spaceGuid, space);

      var SpaceRoutesController = $state.get('endpoint.clusters.cluster.organization.space.detail.routes').controller;
      $controller = new SpaceRoutesController($scope, $stateParams, $q, $log, $state, modelManager, routesService, utils);
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
      expect($controller.update).toBeDefined();
      expect($controller.getInitialActions).toBeDefined();
      expect($controller.appsToNames).toBeDefined();
      expect($controller.updateActions).toBeDefined();
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
