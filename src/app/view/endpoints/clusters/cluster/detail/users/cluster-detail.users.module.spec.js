(function () {
  'use strict';

  describe('cluster detail (users) module', function () {

    var $controller, $httpBackend, $scope;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    var clusterGuid = 'clusterGuid';

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      $scope = $injector.get('$rootScope').$new();
      var $state = $injector.get('$state');
      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      var $q = $injector.get('$q');
      var modelManager = $injector.get('app.model.modelManager');
      var utils = $injector.get('app.utils.utilsService');
      var manageUsers = $injector.get('app.view.endpoints.clusters.cluster.manageUsers');
      var rolesService = $injector.get('app.view.endpoints.clusters.cluster.rolesService');
      var eventService = $injector.get('app.event.eventService');
      var userSelection = $injector.get('app.view.userSelection');

      var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
      stackatoInfo = _.set(stackatoInfo, 'info.endpoints.hcf.' + clusterGuid + '.user', {
        guid: 'user_guid',
        admin: true
      });

      $httpBackend.expectGET('/pp/v1/proxy/v2/users?results-per-page=100').respond({ resources: []});
      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      _.set(authModel, 'principal.' + clusterGuid + '.userSummary.organizations.managed', []);
      _.set(authModel, 'principal.' + clusterGuid + '.userSummary.spaces.managed', []);

      var ClusterUsersController = $state.get('endpoint.clusters.cluster.detail.users').controller;
      $controller = new ClusterUsersController($scope, $state, $stateParams, $q, modelManager, utils, manageUsers,
        rolesService, eventService, userSelection);

    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('initial state', function () {
      expect($controller).toBeDefined();
      expect($controller.guid).toEqual(clusterGuid);
      expect($controller.userActions).toBeDefined();
      expect($controller.stateInitialised).toBeFalsy();
      expect($controller.disableManageRoles).toBeDefined();
      expect($controller.disableChangeRoles).toBeDefined();
      expect($controller.disableRemoveFromOrg).toBeDefined();
      expect($controller.getOrganizationsRoles).toBeDefined();
      expect($controller.selectAllChanged).toBeDefined();
      expect($controller.canRemoveOrgRole).toBeDefined();
      expect($controller.removeOrgRole).toBeDefined();
      expect($controller.selectedUsersCount).toBeDefined();
      expect($controller.manageSelectedUsers).toBeDefined();
      expect($controller.removeAllRoles).toBeDefined();

      $httpBackend.flush();

      expect($controller.stateInitialised).toBeTruthy();

    });

  });

})();
