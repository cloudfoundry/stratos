(function () {
  'use strict';

  describe('cluster space detail (services) module', function () {

    var $controller, $httpBackend, $scope, $state, $stateParams, $q, $filter, modelManager,
      serviceInstanceService, utils;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    var clusterGuid = 'clusterGuid';
    var organizationGuid = 'organizationGuid';
    var spaceGuid = 'spaceGuid';
    var service = {
      metadata: {
        guid: 'serviceGuid'
      },
      entity: {}
    };
    var space = {
      instances: [service],
      details: {
        space: {
          metadata: {
            guid: spaceGuid
          }
        },
        totalServiceInstances: 1
      }
    };

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      $scope = $injector.get('$rootScope').$new();
      $state = $injector.get('$state');
      $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      $stateParams.organization = organizationGuid;
      $stateParams.space = spaceGuid;
      $q = $injector.get('$q');
      $filter = $injector.get('$filter');
      modelManager = $injector.get('app.model.modelManager');
      serviceInstanceService = $injector.get('cloud-foundry.view.applications.services.serviceInstanceService');
      utils = $injector.get('app.utils.utilsService');

      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      _.set(authModel, 'principal.' + clusterGuid + '.isAllowed.apply', _.noop);

    }));

    function createController(space) {
      var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
      _.set(spaceModel, 'spaces.' + clusterGuid + '.' + spaceGuid, space);

      var SpaceServicesController = $state.get('endpoint.clusters.cluster.organization.space.detail.services').controller;
      $controller = new SpaceServicesController($scope, $state, $stateParams, $q, $filter, modelManager,
        serviceInstanceService, utils);
    }

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('initial state - fetch services', function () {
      createController({});
      $httpBackend.expectGET('/pp/v1/proxy/v2/spaces/' + spaceGuid + '/service_instances?include-relations=service_bindings,service_plan,service,app&inline-relations-depth=2&results-per-page=100&return_user_provided_service_instances=true')
        .respond({
          resources: [service]
        });
      $httpBackend.flush();

      expect($controller).toBeDefined();
      expect($controller.update).toBeDefined();
      expect($controller.getInitialActions).toBeDefined();
      expect($controller.createApplicationList).toBeDefined();
      expect($controller.spaceDetail).toBeDefined();
      expect($controller.updateActions).toBeDefined();
    });

    it('initial state - cached services', function () {
      createController(space);
    });

    it('update actions', function () {
      createController(space);
      $controller.visibleServiceInstances = [service];
      $scope.$digest();

    });

  });

})();
