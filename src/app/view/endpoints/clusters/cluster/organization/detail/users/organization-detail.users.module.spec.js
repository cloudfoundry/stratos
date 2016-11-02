(function () {
  'use strict';

  describe('organization detail (users) module', function () {

    var $controller, $httpBackend, $scope;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
    }));

    var clusterGuid = 'guid';
    var organizationGuid = 'organizationGuid';
    var userGuid = 'userGuid';

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Permissions with genuine calls', function () {

      function initController($injector, role) {

        $scope = $injector.get('$rootScope').$new();
        var $state = $injector.get('$state');
        var $stateParams = $injector.get('$stateParams');
        $stateParams.guid = clusterGuid;
        $stateParams.organization = organizationGuid;
        var $q = $injector.get('$q');
        var modelManager = $injector.get('app.model.modelManager');
        var utils = $injector.get('app.utils.utilsService');
        var manageUsers = $injector.get('app.view.endpoints.clusters.cluster.manageUsers');
        var rolesService = $injector.get('app.view.endpoints.clusters.cluster.rolesService');
        var eventService = $injector.get('app.event.eventService');
        var userSelection = $injector.get('app.view.userSelection');

        var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
        _.set(organizationModel, 'organizations.' + clusterGuid + '.' + organizationGuid, {});

        var spaceGuid = 'spaceGuid';

        var authModelOpts = {
          role: role,
          userGuid: userGuid,
          cnsiGuid: clusterGuid,
          spaceGuid: spaceGuid
        };

        mock.cloudFoundryModel.Auth.initAuthModel($injector, authModelOpts);

        var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
        _.set(stackatoInfo, 'info.endpoints.hcf.' + clusterGuid + '.user', {
          guid: 'user_guid',
          admin: true
        });
        //
        $httpBackend.expectGET('/pp/v1/proxy/v2/users?results-per-page=100').respond({resources: []});

        var OrganizationUsersController = $state.get('endpoint.clusters.cluster.organization.detail.users').controller;
        $controller = new OrganizationUsersController($scope, $state, $stateParams, $q, modelManager, utils, manageUsers,
          rolesService, eventService, userSelection);
      }

      describe('as admin', function () {

        beforeEach(inject(function ($injector) {
          initController($injector, 'admin');
          // Didn't add flush here, because
          // the initial state test requires
          // an initialised controller.
        }));

        // it('initial state', function () {
        //   expect($controller).toBeDefined();
        //   expect($controller.guid).toEqual(clusterGuid);
        //   expect($controller.organizationGuid).toEqual(organizationGuid);
        //   expect($controller.userRoles).toBeDefined();
        //   expect($controller.userActions).toBeDefined();
        //   expect($controller.stateInitialised).toBeFalsy();
        //   expect($controller.canUserManageRoles).toBeDefined();
        //   expect($controller.canUserRemoveFromOrg).toBeDefined();
        //   expect($controller.disableManageRoles).toBeDefined();
        //   expect($controller.disableChangeRoles).toBeDefined();
        //   expect($controller.disableRemoveFromOrg).toBeDefined();
        //   expect($controller.getSpaceRoles).toBeDefined();
        //   expect($controller.selectAllChanged).toBeDefined();
        //   expect($controller.canRemoveSpaceRole).toBeDefined();
        //   expect($controller.removeSpaceRole).toBeDefined();
        //   expect($controller.selectedUsersCount).toBeDefined();
        //   expect($controller.manageSelectedUsers).toBeDefined();
        //   expect($controller.removeFromOrganization).toBeDefined();
        //
        //   $httpBackend.flush();
        //
        //   expect($controller.stateInitialised).toBeTruthy();
        //
        // });

        it('should have manage roles enabled', function () {
          $httpBackend.flush();
          expect($controller.userActions[0].disabled).toBeFalsy();
        });

        it('should have remove from organization enabled', function () {
          $httpBackend.flush();
          expect($controller.userActions[1].disabled).toBeFalsy();
        });

      });

      describe('as non-admin', function () {

        beforeEach(inject(function ($injector) {
          initController($injector, 'space_developer');
          $httpBackend.flush();
        }));

        it('should have manage roles disabled', function () {
          expect($controller.userActions[0].disabled).toBeTruthy();
        });

        it('should have remove from organization disabled', function () {
          expect($controller.userActions[1].disabled).toBeTruthy();
        });

      });
    });

    describe('Standard user table tests', function () {

      var $state, $stateParams, $q, modelManager, utils, manageUsers, rolesService, eventService, userSelection;

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

      var space1 = {
        details: {
          guid: 'space1Guid',
          space: {
            metadata: {
              guid: 'space1Guid'
            },
            entity: {
              organization_guid: organizationGuid,
              name: 'Beta'
            }
          }
        }
      };
      _.set(space1, 'roles.' + users[0].metadata.guid, ['space_developer']);
      var space2 = {
        details: {
          guid: 'space2Guid',
          space: {
            metadata: {
              guid: 'space2Guid'
            },
            entity: {
              organization_guid: organizationGuid,
              name: 'Alpha'
            }
          }
        }
      };
      _.set(space2, 'roles.' + users[0].metadata.guid, ['space_manager']);
      var space3 = {
        details: {
          guid: 'space3Guid',
          space: {
            metadata: {
              guid: 'space3Guid'
            },
            entity: {
              organization_guid: organizationGuid,
              name: 'Gamma'
            }
          }
        }
      };
      _.set(space3, 'roles.' + users[0].metadata.guid, ['space_developer']);
      var spaces = {};
      spaces[space1.details.space.metadata.guid] = space1;
      spaces[space2.details.space.metadata.guid] = space2;
      spaces[space3.details.space.metadata.guid] = space3;

      var org1 = {
        spaces: [space1, space2, space3],
        details: {
          guid: organizationGuid,
          org: {
            metadata: {
              guid: organizationGuid
            },
            entity: {
              name: 'Beta'
            }
          }
        }
      };
      var organizations = _.set({}, org1.details.org.metadata.guid, org1);

      function createController() {
        var OrganizationUsersController = $state.get('endpoint.clusters.cluster.organization.detail.users').controller;
        $controller = new OrganizationUsersController($scope, $state, $stateParams, $q, modelManager, utils, manageUsers,
          rolesService, eventService, userSelection);
      }

      beforeEach(inject(function ($injector) {

        $scope = $injector.get('$rootScope').$new();
        $state = $injector.get('$state');
        $stateParams = $injector.get('$stateParams');
        $stateParams.guid = clusterGuid;
        $stateParams.organization = organizationGuid;
        $q = $injector.get('$q');
        modelManager = $injector.get('app.model.modelManager');
        utils = $injector.get('app.utils.utilsService');
        manageUsers = $injector.get('app.view.endpoints.clusters.cluster.manageUsers');
        rolesService = $injector.get('app.view.endpoints.clusters.cluster.rolesService');
        eventService = $injector.get('app.event.eventService');
        userSelection = $injector.get('app.view.userSelection');

        var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
        _.set(stackatoInfo, 'info.endpoints.hcf.' + clusterGuid + '.user', {
          guid: 'user_guid',
          admin: true
        });

        var authModel = modelManager.retrieve('cloud-foundry.model.auth');
        _.set(authModel, 'principal.' + clusterGuid + '.userSummary.organizations.managed', [
          {}
        ]);
        _.set(authModel, 'principal.' + clusterGuid + '.userSummary.spaces.managed', []);
        spyOn(authModel, 'isAllowed').and.callFake(function (cnsiGuid, resource, action, something, orgGuid) {
          expect(cnsiGuid).toEqual(clusterGuid);
          expect(orgGuid).toEqual(organizationGuid);
          return true;
        });

        // Initial set of organizations
        var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
        _.set(organizationModel, 'organizations.' + clusterGuid, organizations);

        // Initial set of spaces
        var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
        _.set(spaceModel, 'spaces.' + clusterGuid, spaces);

        spyOn(rolesService, 'listUsers').and.callFake(function (inClusterGuid) {
          expect(inClusterGuid).toEqual(clusterGuid);
          return $q.resolve(users);
        });

      }));

      it('initial state', function () {

        createController();

        expect($controller).toBeDefined();
        expect($controller.guid).toEqual(clusterGuid);
        expect($controller.organizationGuid).toEqual(organizationGuid);
        expect($controller.userRoles).toBeDefined();
        expect($controller.userActions).toBeDefined();
        expect($controller.stateInitialised).toBeFalsy();
        expect($controller.canUserManageRoles).toBeDefined();
        expect($controller.canUserRemoveFromOrg).toBeDefined();
        expect($controller.disableManageRoles).toBeDefined();
        expect($controller.disableChangeRoles).toBeDefined();
        expect($controller.disableRemoveFromOrg).toBeDefined();
        expect($controller.getSpaceRoles).toBeDefined();
        expect($controller.selectAllChanged).toBeDefined();
        expect($controller.canRemoveSpaceRole).toBeDefined();
        expect($controller.removeSpaceRole).toBeDefined();
        expect($controller.selectedUsersCount).toBeDefined();
        expect($controller.manageSelectedUsers).toBeDefined();
        expect($controller.removeFromOrganization).toBeDefined();

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

        // userRoles
        expect($controller.userRoles[users[0].metadata.guid]).toEqual([
          {
            space: space1,
            role: 'space_developer',
            roleLabel: 'Developer'
          },
          {
            space: space2,
            role: 'space_manager',
            roleLabel: 'Manager'
          },
          {
            space: space3,
            role: 'space_developer',
            roleLabel: 'Developer'
          }
        ]);

        // userActions
        expect($controller.userActions).toBeDefined();
        expect($controller.userActions[0].disabled).toBeFalsy();
        expect($controller.userActions[1].disabled).toBeFalsy();

      });

      it('disableManageRoles', function () {
        createController();

        expect($controller.disableManageRoles()).toBeTruthy();

        $controller.selectedUsers = {};
        $controller.selectedUsers[users[0].metadata.guid] = true;
        $controller.selectedUsers[users[1].metadata.guid] = false;

        expect($controller.disableManageRoles()).toBeFalsy();

        $controller.selectedUsers[users[1].metadata.guid] = true;

        expect($controller.disableManageRoles()).toBeTruthy();
      });

      it('disableChangeRoles', function () {
        createController();

        expect($controller.disableChangeRoles()).toBeFalsy();
      });

      it('disableRemoveFromOrg', function () {
        createController();

        expect($controller.disableRemoveFromOrg()).toBeTruthy();

        $controller.selectedUsers = {};
        $controller.selectedUsers[users[0].metadata.guid] = true;

        expect($controller.disableRemoveFromOrg()).toBeFalsy();

        $controller.selectedUsers[users[0].metadata.guid] = false;

        expect($controller.disableRemoveFromOrg()).toBeTruthy();
      });

      it('user actions - execute', function () {
        createController();
        $scope.$digest();

        // Manage Roles
        spyOn(manageUsers, 'show').and.callFake(function (inClusterGuid, inOrgGuid, inUsers) {
          expect(inClusterGuid).toEqual(clusterGuid);
          expect(inOrgGuid).toEqual(organizationGuid);
          expect(inUsers).toEqual([users[0]]);
          return {
            result: 'defined'
          };
        });
        expect($controller.userActions[0].execute(users[0])).toBeDefined();

        // Remove from org
        spyOn(rolesService, 'removeFromOrganization').and.callFake(function (inClusterGuid, inOrgGuid, inUsers) {
          expect(inClusterGuid).toEqual(clusterGuid);
          expect(inOrgGuid).toEqual(organizationGuid);
          expect(inUsers).toEqual([users[0]]);
          return 'defined';
        });
        expect($controller.userActions[1].execute(users[0])).toBeDefined();
      });

      it('manageSelectedUsers', function () {
        createController();
        $scope.$digest();

        $controller.selectedUsers = {};
        $controller.selectedUsers[users[0].metadata.guid] = false;
        $controller.selectedUsers[users[1].metadata.guid] = true;

        spyOn(manageUsers, 'show').and.callFake(function (inClusterGuid, inOrgGuid, inUsers) {
          expect(inClusterGuid).toEqual(clusterGuid);
          expect(inOrgGuid).toEqual(organizationGuid);
          expect(inUsers).toEqual([users[1]]);
          return {
            result: 'defined'
          };
        });

        expect($controller.manageSelectedUsers()).toBeDefined();

      });

      it('removeFromOrganization', function () {
        createController();
        $scope.$digest();

        $controller.selectedUsers = {};
        $controller.selectedUsers[users[0].metadata.guid] = true;
        $controller.selectedUsers[users[1].metadata.guid] = false;

        spyOn(rolesService, 'removeFromOrganization').and.callFake(function (inClusterGuid, inOrgGuid, inUsers) {
          expect(inClusterGuid).toEqual(clusterGuid);
          expect(inOrgGuid).toEqual(organizationGuid);
          expect(inUsers).toEqual([users[0]]);
          return 'defined';
        });

        expect($controller.removeFromOrganization()).toBeDefined();

      });

      it('selectAllChanged - no selection', function () {
        createController();
        $scope.$digest();

        delete $controller.selectAllUsers;

        spyOn(userSelection, 'selectUsers');
        spyOn(userSelection, 'deselectAllUsers').and.callFake(function (inClusterGuid) {
          expect(inClusterGuid).toEqual(clusterGuid);
        });

        $controller.selectAllChanged();

        expect(userSelection.selectUsers).not.toHaveBeenCalled();
        expect(userSelection.deselectAllUsers).toHaveBeenCalled();

      });

      it('selectAllChanged - no selection', function () {
        createController();
        $scope.$digest();

        spyOn(userSelection, 'selectUsers').and.callFake(function (inClusterGuid) {
          expect(inClusterGuid).toEqual(clusterGuid);
        });
        spyOn(userSelection, 'deselectAllUsers');

        $controller.selectAllChanged();

        expect(userSelection.selectUsers).toHaveBeenCalled();
        expect(userSelection.deselectAllUsers).not.toHaveBeenCalled();

      });

    });

  });

})();
