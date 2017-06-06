(function () {
  'use strict';

  describe('cluster detail (users) module', function () {

    var $controller, $httpBackend, $scope, $state, $stateParams, $q, modelManager, appUtilsService, appClusterManageUsers,
      appClusterRolesService, appEventService, appUserSelection, orgModel;

    beforeEach(module('templates'));
    beforeEach(module('console-app'));

    var clusterGuid = 'clusterGuid';

    var users = [
      {
        metadata: {
          guid: 'userAGuid'
        },
        entity: {
          username: 'userA'
        }
      },
      {
        metadata: {
          guid: 'userBGuid'
        },
        entity: {
          username: 'userB'
        }
      }
    ];

    var org1 = {
      details: {
        guid: 'org1Guid',
        org: {
          metadata: {
            guid: 'org1Guid'
          },
          entity: {
            name: 'Beta'
          }
        }
      }
    };
    _.set(org1, 'roles.' + users[0].metadata.guid, [ 'org_user' ]);

    var org2 = {
      details: {
        guid: 'org2Guid',
        org: {
          metadata: {
            guid: 'org2Guid'
          },
          entity: {
            name: 'Alpha'
          }
        }
      }
    };
    _.set(org2, 'roles.' + users[0].metadata.guid, [ 'org_user', 'org_manager' ]);

    var organizations = {};
    organizations[org1.details.org.metadata.guid] = org1;
    organizations[org2.details.org.metadata.guid] = org2;

    function createController() {
      var ClusterUsersController = $state.get('endpoint.clusters.cluster.detail.users').controller;
      $controller = new ClusterUsersController($scope, $state, $stateParams, $q, modelManager, appUtilsService, appClusterManageUsers,
        appClusterRolesService, appEventService, appUserSelection, orgModel);
    }

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      $scope = $injector.get('$rootScope').$new();
      $state = $injector.get('$state');
      $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      $q = $injector.get('$q');
      modelManager = $injector.get('modelManager');
      appUtilsService = $injector.get('appUtilsService');
      appClusterManageUsers = $injector.get('appClusterManageUsers');
      appClusterRolesService = $injector.get('appClusterRolesService');
      appEventService = $injector.get('appEventService');
      appUserSelection = $injector.get('appUserSelection');
      orgModel = $injector.get('cfOrganizationModel');

      var consoleInfo = modelManager.retrieve('app.model.consoleInfo');
      _.set(consoleInfo, 'info.endpoints.cf.' + clusterGuid + '.user', {
        guid: 'user_guid',
        admin: true
      });

      //$httpBackend.expectGET('/pp/v1/proxy/v2/users?results-per-page=100').respond({ resources: []});
      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      _.set(authModel, 'principal.' + clusterGuid + '.userSummary.organizations.managed', [
        {

        }
      ]);
      _.set(authModel, 'principal.' + clusterGuid + '.userSummary.spaces.managed', []);
      spyOn(authModel, 'isAllowed').and.callFake(function (cnsiGuid, resource, action, orgGuid) {
        return orgGuid !== org1.details.org.metadata.guid;
      });

      // Initial set of organizations
      var cfOrganizationModel = $injector.get('cfOrganizationModel');
      _.set(cfOrganizationModel, 'organizations.' + clusterGuid, organizations);

      spyOn(appClusterRolesService, 'listUsers').and.callFake(function (inClusterGuid) {
        expect(inClusterGuid).toEqual(clusterGuid);
        return $q.resolve(users);
      });

    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('initial state', function () {

      createController();

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

    });

    it('init', function () {

      createController();
      $scope.$digest();

      expect($controller.stateInitialised).toBeTruthy();
    });

    it('refreshUsers', function () {
      createController();
      $scope.$digest();

      expect($controller.stateInitialised).toBeTruthy();
      expect($controller.canEditAnOrg).toBeTruthy();

      // userRoles
      expect($controller.userRoles[users[0].metadata.guid]).toEqual([
        {
          org: org1,
          role: 'org_user',
          roleLabel: 'roles.org.short.org_user'
        },
        {
          org: org2,
          role: 'org_user',
          roleLabel: 'roles.org.short.org_user'
        },
        {
          org: org2,
          role: 'org_manager',
          roleLabel: 'roles.org.short.org_manager'
        }
      ]);

      // userActions
      expect($controller.userActions[users[0].metadata.guid]).toBeDefined();
      expect($controller.userActions[users[0].metadata.guid][0].disabled).toBeFalsy();
      expect($controller.userActions[users[0].metadata.guid][1].disabled).toBeTruthy();

    });

    it('disableManageRoles', function () {
      createController();

      expect($controller.disableManageRoles()).toBeTruthy();

      $controller.selectedUsers = {};
      $controller.selectedUsers[users[0].metadata.guid] = true;
      $controller.selectedUsers[users[1].metadata.guid] = false;
      $controller.canEditAnOrg = true;

      expect($controller.disableManageRoles()).toBeFalsy();

      $controller.canEditAnOrg = false;

      expect($controller.disableManageRoles()).toBeTruthy();

      $controller.canEditAnOrg = true;
      $controller.selectedUsers[users[1].metadata.guid] = false;

      expect($controller.disableManageRoles()).toBeFalsy();
    });

    it('disableChangeRoles', function () {
      createController();

      expect($controller.disableChangeRoles()).toBeTruthy();

      $controller.canEditAnOrg = true;

      expect($controller.disableChangeRoles()).toBeFalsy();
    });

    it('disableRemoveFromOrg', function () {
      createController();

      expect($controller.disableRemoveFromOrg()).toBeTruthy();

      $controller.selectedUsers = {};
      $controller.selectedUsers[users[0].metadata.guid] = true;
      $controller.selectedUsers[users[1].metadata.guid] = true;
      $controller.canEditAllOrgs = true;

      expect($controller.disableRemoveFromOrg()).toBeFalsy();

      $controller.canEditAllOrgs = false;

      expect($controller.disableRemoveFromOrg()).toBeTruthy();

      $controller.canEditAllOrgs = true;
      $controller.selectedUsers[users[1].metadata.guid] = false;

      expect($controller.disableRemoveFromOrg()).toBeFalsy();
    });

    it('user actions - execute', function () {
      createController();
      $scope.$digest();

      // Manage Roles
      spyOn(appClusterManageUsers, 'show').and.callFake(function (inClusterGuid, something, inUsers) {
        expect(inClusterGuid).toEqual(clusterGuid);
        expect(something).toBeFalsy();
        expect(inUsers).toEqual([users[0]]);
        return {
          result: 'defined'
        };
      });
      expect($controller.userActions[users[0].metadata.guid][0].execute(users[0])).toBeDefined();

      // Remove all roles
      spyOn(appClusterRolesService, 'removeAllRoles').and.callFake(function (inClusterGuid, inUsers) {
        expect(inClusterGuid).toEqual(clusterGuid);
        expect(inUsers).toEqual([users[0]]);
        return 'defined';
      });
      expect($controller.userActions[users[0].metadata.guid][1].execute(users[0])).toBeDefined();
    });

    it('manageSelectedUsers', function () {
      createController();
      $scope.$digest();

      $controller.selectedUsers = {};
      $controller.selectedUsers[users[0].metadata.guid] = false;
      $controller.selectedUsers[users[1].metadata.guid] = true;

      spyOn(appClusterManageUsers, 'show').and.callFake(function (inClusterGuid, something, inUsers) {
        expect(inClusterGuid).toEqual(clusterGuid);
        expect(something).toBeFalsy();
        expect(inUsers).toEqual([users[1]]);
        return {
          result: 'defined'
        };
      });

      expect($controller.manageSelectedUsers()).toBeDefined();

    });

    it('removeAllRoles', function () {
      createController();
      $scope.$digest();

      $controller.selectedUsers = {};
      $controller.selectedUsers[users[0].metadata.guid] = true;
      $controller.selectedUsers[users[1].metadata.guid] = false;

      spyOn(appClusterRolesService, 'removeAllRoles').and.callFake(function (inClusterGuid, inUsers) {
        expect(inClusterGuid).toEqual(clusterGuid);
        expect(inUsers).toEqual([users[0]]);
        return 'defined';
      });

      expect($controller.removeAllRoles()).toBeDefined();

    });

  });

})();
