(function () {
  'use strict';

  describe('Assign Users test', function () {
    var assignUsersService, assignUsersController, $httpBackend, $uibModal, $uibModalInstance, $scope, modelManager,
      rolesService, $stateParams, $q, $timeout, $controller, stackatoInfo;

    var clusterGuid = 'clusterGuid';
    var organizationGuid = 'organizationGuid';
    var spaceGuid = 'spaceGuid';
    var selectedUsers = {userGuid: {entity: {username: 'name'}}};

    var content = {
      clusterGuid: clusterGuid,
      organizationGuid: organizationGuid,
      spaceGuid: spaceGuid,
      selectedUsers: selectedUsers
    };

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {

      $httpBackend = $injector.get('$httpBackend');
      $uibModal = $injector.get('$uibModal');
      $uibModalInstance = {
        close: angular.noop,
        dismiss: angular.noop
      };

      $scope = $injector.get('$rootScope').$new();
      modelManager = $injector.get('app.model.modelManager');
      rolesService = $injector.get('app.view.endpoints.clusters.cluster.rolesService');
      $stateParams = $injector.get('$stateParams');
      $q = $injector.get('$q');
      $timeout = $injector.get('$timeout');

      $controller = $injector.get('$controller');

      stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

      assignUsersService = $injector.get('app.view.endpoints.clusters.cluster.assignUsers');

    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    function createBasicController(context) {
      assignUsersController = $controller('app.view.endpoints.clusters.cluster.assignUsersController', {
        $scope: $scope,
        modelManager: modelManager,
        context: context || {},
        rolesService: rolesService,
        $stateParams: $stateParams,
        $q: $q,
        $timeout: $timeout,
        $uibModalInstance: $uibModalInstance
      });
    }

    it('should be defined', function () {
      expect(assignUsersService).toBeDefined();
      expect(assignUsersService.assign).toBeDefined();

      createBasicController();
      expect(assignUsersController).toBeDefined();
    });

    it('should pass correct content spec to detailView', function () {
      // This will call initialiseSelect, so ensure it has all the shizzle to run
      _.set(stackatoInfo, 'info.endpoints.hcf.clusterGuid.user.admin', true);
      // User services list
      $httpBackend.whenGET('/pp/v1/proxy/v2/users?results-per-page=100').respond({ resources: []});

      var modalObj = assignUsersService.assign(content);

      $httpBackend.flush();

      expect(modalObj.opened).toBeDefined();
    });

    it('initialise', function () {
      createBasicController(content);

      expect(assignUsersController.options).toBeDefined();
      expect(assignUsersController.assigning).toBeDefined();
      expect(assignUsersController.actions).toBeDefined();
      expect(assignUsersController.data).toBeDefined();
      expect(assignUsersController.userInput).toBeDefined();

      expect(assignUsersController.data.clusterGuid).toEqual(clusterGuid);
      expect(assignUsersController.data.organizationGuid).toEqual(organizationGuid);
      expect(assignUsersController.data.spaceGuid).toEqual(spaceGuid);

      expect(assignUsersController.userInput.selectedUsersByGuid).toEqual(selectedUsers);

      expect(assignUsersController.options.workflow).toBeDefined();
      expect(assignUsersController.options.workflow.steps).toBeDefined();
      expect(assignUsersController.options.workflow.steps.length).toEqual(2);

      expect(assignUsersController.actions.stop).toBeDefined();
      expect(assignUsersController.actions.finish).toBeDefined();

    });
  });
})();
