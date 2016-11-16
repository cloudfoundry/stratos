(function () {
  'use strict';

  describe('cluster space detail (applications) module', function () {

    var $controller, $httpBackend, $state, $stateParams, $q, $scope, modelManager, utils, appStateService, spaceModel;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    var clusterGuid = 'clusterGuid';
    var organizationGuid = 'organizationGuid';
    var spaceGuid = 'spaceGuid';
    var app = {
      metadata: {
        guid: 'appGuid',
        created_at: '1970-01-01T00:00:01Z'
      },
      entity: {
      }
    };
    var space = {
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

      $state = $injector.get('$state');
      $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      $stateParams.organization = organizationGuid;
      $stateParams.space = spaceGuid;
      $q = $injector.get('$q');
      $scope = $injector.get('$rootScope').$new();
      modelManager = $injector.get('app.model.modelManager');
      utils = $injector.get('app.utils.utilsService');
      appStateService = $injector.get('cloud-foundry.model.application.stateService');

      spaceModel = modelManager.retrieve('cloud-foundry.model.space');

    }));

    function createController() {
      var SpaceapplicationsController = $state.get('clusters.cluster.organization.space.detail.applications').controller;
      $controller = new SpaceapplicationsController($state, $stateParams, $q, $scope, modelManager, utils, appStateService);
    }

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('initial state - no init', function () {
      _.set(spaceModel, 'spaces.' + clusterGuid + '.' + spaceGuid, _.cloneDeep(space));

      createController();

      expect($controller).toBeDefined();
      expect($controller.spaceDetail).toBeDefined();
      expect($controller.goToApp).toBeDefined();
    });

    it('initial state - init - no apps', function () {
      _.set(spaceModel, 'spaces.' + clusterGuid + '.' + spaceGuid, _.cloneDeep(space));

      createController();
      $scope.$digest();
    });

    it('initial state - init - apps', function () {
      var clonedSpace = _.cloneDeep(space);
      clonedSpace.apps = [app];
      _.set(spaceModel, 'spaces.' + clusterGuid + '.' + spaceGuid, clonedSpace);

      var state = 'state';
      spyOn(appStateService, 'get').and.callFake(function (appEntity) {
        expect(appEntity).toEqual(app.entity);
        return state;
      });

      createController();
      $scope.$digest();

      expect(clonedSpace.apps[0].state).toBeDefined();
      expect(clonedSpace.apps[0].state).toEqual(state);
      expect(clonedSpace.apps[0].invertedCreatedTimestamp).toBeDefined();
      expect(clonedSpace.apps[0].invertedCreatedTimestamp).toEqual(-1);
      expect(clonedSpace.apps[0].createdTimestampString).toBeDefined();

    });

    it('go to app', function () {
      _.set(spaceModel, 'spaces.' + clusterGuid + '.' + spaceGuid, _.cloneDeep(space));

      createController();

      spyOn($state, 'go').and.callFake(function (state, stateGoParams) {
        expect(stateGoParams.cnsiGuid).toEqual(clusterGuid);
        expect(stateGoParams.guid).toEqual(app.metadata.guid);
      });

      $controller.goToApp(app);
      $scope.$digest();
    });

  });

})();
