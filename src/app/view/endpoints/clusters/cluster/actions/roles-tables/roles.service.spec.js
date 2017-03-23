(function () {
  'use strict';

  describe('roles service', function () {

    var $httpBackend, rolesService, modelManager, $uibModal, $q, organizationModel, spaceModel, authModel, testModelOrg,
      testModelSpace;

    var clusterGuid = 'clusterGuid';
    var orgGuid = 'orgGuid';
    var spaceGuid = 'spaceGuid';
    var userGuid = 'userGuid';

    var roleNames = {
      org: {
        org_user: 'org_user',
        org_manager: 'org_manager'
      },
      space: {
        space_developer: 'space_developer',
        space_manager: 'space_manager'
      }
    };

    var user = {
      metadata: {
        guid: userGuid
      },
      entity: {
        username: 'auser'
      }
    };

    var modelOrg = {
      details: {
        guid: orgGuid,
        org: {
          entity: {
            users: [],
            managers: [],
            billing_managers: [],
            auditors: []
          }
        }
      },
      roles: {}
    };
    modelOrg.roles[userGuid] = [];

    var space = {
      entity: {
        developers: [],
        managers: [],
        auditors: []
      },
      metadata: {
        guid: spaceGuid
      }
    };
    var modelSpace = {
      details: {
        space: space
      },
      roles: {}
    };
    modelSpace.roles[userGuid] = [];

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      rolesService = $injector.get('app.view.endpoints.clusters.cluster.rolesService');
      modelManager = $injector.get('modelManager');
      $uibModal = $injector.get('$uibModal');
      $q = $injector.get('$q');

      authModel = modelManager.retrieve('cloud-foundry.model.auth');
      // By default allow everything. Will need to be tweaked for further tests
      _.set(authModel, 'principal.' + clusterGuid + '.isAllowed.apply', function () {
        return true;
      });

      // By default accept all confirmation modals. Will need to be tweaked for further tests
      spyOn($uibModal, 'open').and.callFake(function (config) {
        return { result:  config.resolve.confirmDialogContext().callback() };
      });

      testModelOrg = _.cloneDeep(modelOrg);
      testModelSpace = _.cloneDeep(modelSpace);

      organizationModel = $injector.get('organization-model');
      spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();

      delete organizationModel.organizations;
      delete spaceModel.spaces;
      delete authModel.principal;
    });

    it('should be defined', function () {
      expect(rolesService).toBeDefined();
      expect(rolesService.canRemoveOrgRole).toBeDefined();
      expect(rolesService.removeOrgRole).toBeDefined();
      expect(rolesService.removeSpaceRole).toBeDefined();
      expect(rolesService.removeAllRoles).toBeDefined();
      expect(rolesService.removeFromOrganization).toBeDefined();
      expect(rolesService.removeFromSpace).toBeDefined();
      expect(rolesService.assignUsers).toBeDefined();
      expect(rolesService.updateUsers).toBeDefined();
      expect(rolesService.clearOrg).toBeDefined();
      expect(rolesService.clearOrgs).toBeDefined();
      expect(rolesService.orgContainsRoles).toBeDefined();
      expect(rolesService.updateRoles).toBeDefined();
      expect(rolesService.listUsers).toBeDefined();
    });

    function expectChangeOrgRole(add, role) {
      if (add) {
        $httpBackend.expectPUT('/pp/v1/proxy/v2/organizations/' + orgGuid + '/' + role + '/' + user.metadata.guid)
          .respond(200);
      } else {
        $httpBackend.expectDELETE('/pp/v1/proxy/v2/organizations/' + orgGuid + '/' + role + '/' + user.metadata.guid)
          .respond(200);
      }
    }

    function expectRefreshOrg(updatedUsers) {
      // this should end with ?results-per-page=100, need to go back and update refreshOrganizationUserRoles
      $httpBackend.expectGET('/pp/v1/proxy/v2/organizations/' + orgGuid + '/user_roles')
        .respond({ resources: updatedUsers});
    }

    function expectChangeSpaceRole(add, role) {
      if (add) {
        $httpBackend.expectPUT('/pp/v1/proxy/v2/spaces/' + spaceGuid + '/' + role + '/' + user.metadata.guid)
          .respond(200);
      } else {
        $httpBackend.expectDELETE('/pp/v1/proxy/v2/spaces/' + spaceGuid + '/' + role + '/' + user.metadata.guid)
          .respond(200);
      }

    }

    function expectRefreshSpace(updatedUsers) {
      $httpBackend.expectGET('/pp/v1/proxy/v2/spaces/' + spaceGuid + '/user_roles?results-per-page=100')
        .respond({ resources: updatedUsers});
    }

    describe('canRemoveOrgRole', function () {

      it('can remove roles other than org_user ', function () {
        expect(rolesService.canRemoveOrgRole(roleNames.org.org_manager, clusterGuid, orgGuid, userGuid)).toBeTruthy();
      });

      it('cannot remove role if non-org_user roles exist', function () {
        testModelOrg.roles[userGuid].length = 0;
        testModelOrg.roles[userGuid].push(roleNames.org.org_user);
        testModelOrg.roles[userGuid].push(roleNames.org.org_manager);

        _.set(organizationModel, 'organizations.' + clusterGuid + '.' + orgGuid, testModelOrg);
        _.set(spaceModel, 'spaces.' + clusterGuid, {});
        expect(rolesService.canRemoveOrgRole(roleNames.org.org_user, clusterGuid, orgGuid, userGuid)).toBeFalsy();
      });

      it('cannot remove role if user has space roles', function () {
        testModelOrg.roles[userGuid].length = 0;
        testModelOrg.roles[userGuid].push(roleNames.org.org_user);
        _.set(testModelOrg, 'spaces.' + spaceGuid, space);

        testModelSpace.roles[userGuid].length = 0;
        testModelSpace.roles[userGuid].push(roleNames.space.space_developer);

        _.set(organizationModel, 'organizations.' + clusterGuid + '.' + orgGuid, testModelOrg);
        _.set(spaceModel, 'spaces.' + clusterGuid + '.' + spaceGuid, testModelSpace);
        expect(rolesService.canRemoveOrgRole(roleNames.org.org_user, clusterGuid, orgGuid, userGuid)).toBeFalsy();
      });

      it('can remove role if user has no space roles', function () {
        testModelOrg.roles[userGuid].length = 0;
        testModelOrg.roles[userGuid].push(roleNames.org.org_user);
        _.set(testModelOrg, 'spaces.' + spaceGuid, space);

        testModelSpace.roles[userGuid].length = 0;

        _.set(organizationModel, 'organizations.' + clusterGuid + '.' + orgGuid, testModelOrg);
        _.set(spaceModel, 'spaces.' + clusterGuid + '.' + spaceGuid, testModelSpace);
        expect(rolesService.canRemoveOrgRole(roleNames.org.org_user, clusterGuid, orgGuid, userGuid)).toBeTruthy();
      });

    });

    describe('removeOrgRole', function () {

      it('remove only role - org_user', function () {
        // Set up expected calls
        expectChangeOrgRole(false, 'users');
        expectRefreshOrg([{
          metadata: {
            guid: userGuid
          },
          entity: {
            organization_roles: []
          }
        }]);

        // Set up pre-change model
        testModelOrg.roles[userGuid].length = 0;
        testModelOrg.roles[userGuid].push(roleNames.org.org_user);
        _.set(organizationModel, 'organizations.' + clusterGuid + '.' + orgGuid, testModelOrg);

        expect(organizationModel.organizations[clusterGuid][orgGuid].roles[user.metadata.guid]).toEqual([roleNames.org.org_user]);

        rolesService.removeOrgRole(clusterGuid, orgGuid, user, roleNames.org.org_user)
          .then(function () {
            expect(organizationModel.organizations[clusterGuid][orgGuid].roles[user.metadata.guid]).toEqual([]);
          })
          .catch(function () {
            fail('removeOrgRole should have succeeded');
          });

        $httpBackend.flush();

      });

    });

    describe('removeSpaceRole', function () {

      it('remove only role - space_developer', function () {
        // Set up expected calls
        expectChangeSpaceRole(false, 'developers');
        expectRefreshSpace([{
          metadata: {
            guid: userGuid
          },
          entity: {
            space_roles: []
          }
        }]);

        // Set up pre-change model
        testModelSpace.roles[userGuid].length = 0;
        testModelSpace.roles[userGuid].push(roleNames.space.space_developer);
        _.set(spaceModel, 'spaces.' + clusterGuid + '.' + spaceGuid, testModelSpace);

        expect(spaceModel.spaces[clusterGuid][spaceGuid].roles[user.metadata.guid]).toEqual([roleNames.space.space_developer]);

        rolesService.removeSpaceRole(clusterGuid, orgGuid, spaceGuid, user, roleNames.space.space_developer)
          .then(function () {
            expect(spaceModel.spaces[clusterGuid][spaceGuid].roles[user.metadata.guid]).toEqual([]);
          })
          .catch(function () {
            fail('removeSpaceRole should have succeeded');
          });

        $httpBackend.flush();
      });

    });

    describe('assignUsers', function () {

      it('assign single org and space roles to empty org + space', function () {
        // Set up org where user has no roles
        testModelOrg.roles[userGuid].length = 0;
        _.set(organizationModel, 'organizations.' + clusterGuid + '.' + orgGuid, testModelOrg);
        // _.set(organizationModel, 'organizations.' + clusterGuid + '.' + orgGuid, );

        expect(organizationModel.organizations[clusterGuid][orgGuid].roles[user.metadata.guid]).toEqual([]);

        // Set up space where user has no roles
        testModelSpace.roles[userGuid].length = 0;
        _.set(spaceModel, 'spaces.' + clusterGuid + '.' + spaceGuid, testModelSpace);
        expect(spaceModel.spaces[clusterGuid][spaceGuid].roles[user.metadata.guid]).toEqual([]);

        // Set up expected calls
        expectChangeOrgRole(true, 'users');
        expectChangeSpaceRole(true, 'developers');
        expectRefreshOrg([{
          metadata: {
            guid: userGuid
          },
          entity: {
            organization_roles: [roleNames.org.org_user]
          }
        }]);

        expectRefreshSpace([{
          metadata: {
            guid: userGuid
          },
          entity: {
            space_roles: [roleNames.space.space_developer]
          }
        }]);

        // Set up function params
        var selectedUsers = { };
        _.set(selectedUsers, user.metadata.guid, user);
        var newRoles = { };
        _.set(newRoles, orgGuid + '.organization.' + roleNames.org.org_user, true);
        _.set(newRoles, orgGuid + '.spaces.' + spaceGuid + '.' + roleNames.space.space_developer, true);

        rolesService.assignUsers(clusterGuid, selectedUsers, newRoles)
          .then(function () {
            expect(organizationModel.organizations[clusterGuid][orgGuid].roles[user.metadata.guid]).toEqual([roleNames.org.org_user]);
            expect(spaceModel.spaces[clusterGuid][spaceGuid].roles[user.metadata.guid]).toEqual([roleNames.space.space_developer]);
          })
          .catch(function () {
            fail('removeSpaceRole should have succeeded');
          });

        $httpBackend.flush();
      });

    });

    describe('removeAllRoles', function () {

      it('remove one org and space role', function () {
        // Set up expected calls
        expectChangeOrgRole(false, 'users');
        expectChangeSpaceRole(false, 'developers');
        expectRefreshOrg([{
          metadata: {
            guid: userGuid
          },
          entity: {
            organization_roles: []
          }
        }]);
        expectRefreshSpace([{
          metadata: {
            guid: userGuid
          },
          entity: {
            space_roles: []
          }
        }]);

        // Set up pre-change model
        testModelOrg.roles[userGuid].length = 0;
        testModelOrg.roles[userGuid].push(roleNames.org.org_user);
        _.set(organizationModel, 'organizations.' + clusterGuid + '.' + orgGuid, testModelOrg);
        expect(organizationModel.organizations[clusterGuid][orgGuid].roles[user.metadata.guid]).toEqual([roleNames.org.org_user]);
        _.set(testModelOrg, 'spaces.' + spaceGuid, space);

        // Set up pre-change model
        testModelSpace.roles[userGuid].length = 0;
        testModelSpace.roles[userGuid].push(roleNames.space.space_developer);
        _.set(spaceModel, 'spaces.' + clusterGuid + '.' + spaceGuid, testModelSpace);
        expect(spaceModel.spaces[clusterGuid][spaceGuid].roles[user.metadata.guid]).toEqual([roleNames.space.space_developer]);

        rolesService.removeAllRoles(clusterGuid, [user])
          .then(function () {
            expect(organizationModel.organizations[clusterGuid][orgGuid].roles[user.metadata.guid]).toEqual([]);
            expect(spaceModel.spaces[clusterGuid][spaceGuid].roles[user.metadata.guid]).toEqual([]);
          })
          .catch(function () {
            fail('removeAllRoles should have succeeded');
          });

        $httpBackend.flush();
      });

    });

    describe('removeFromOrganization', function () {

      it('remove two org roles', function () {

        // Set up expected calls
        expectChangeOrgRole(false, 'managers');
        expectChangeOrgRole(false, 'users');
        expectRefreshOrg([{
          metadata: {
            guid: userGuid
          },
          entity: {
            organization_roles: []
          }
        }]);

        // Set up pre-change model
        testModelOrg.roles[userGuid].length = 0;
        testModelOrg.roles[userGuid].push(roleNames.org.org_user);
        testModelOrg.roles[userGuid].push(roleNames.org.org_manager);
        _.set(organizationModel, 'organizations.' + clusterGuid + '.' + orgGuid, testModelOrg);

        expect(organizationModel.organizations[clusterGuid][orgGuid].roles[user.metadata.guid]).toEqual([roleNames.org.org_user, roleNames.org.org_manager]);

        rolesService.removeFromOrganization(clusterGuid, orgGuid, [user])
          .then(function () {
            expect(organizationModel.organizations[clusterGuid][orgGuid].roles[user.metadata.guid]).toEqual([]);
          })
          .catch(function () {
            fail('removeFromOrganization should have succeeded');
          });

        $httpBackend.flush();
      });
    });

    describe('removeFromSpace', function () {

      it('remove two roles', function () {
        // Set up expected calls
        expectChangeSpaceRole(false, 'developers');
        expectChangeSpaceRole(false, 'managers');
        expectRefreshSpace([{
          metadata: {
            guid: userGuid
          },
          entity: {
            space_roles: []
          }
        }]);

        // Set up pre-change model
        testModelOrg.roles[userGuid].length = 0;
        testModelOrg.roles[userGuid].push(roleNames.org.org_user);
        _.set(organizationModel, 'organizations.' + clusterGuid + '.' + orgGuid, testModelOrg);
        expect(organizationModel.organizations[clusterGuid][orgGuid].roles[user.metadata.guid]).toEqual([roleNames.org.org_user]);
        _.set(testModelOrg, 'spaces.' + spaceGuid, space);

        // Set up pre-change model
        testModelSpace.roles[userGuid].length = 0;
        testModelSpace.roles[userGuid].push(roleNames.space.space_developer);
        testModelSpace.roles[userGuid].push(roleNames.space.space_manager);
        _.set(spaceModel, 'spaces.' + clusterGuid + '.' + spaceGuid, testModelSpace);

        expect(spaceModel.spaces[clusterGuid][spaceGuid].roles[user.metadata.guid]).toEqual([roleNames.space.space_developer, roleNames.space.space_manager]);

        rolesService.removeFromSpace(clusterGuid, orgGuid, spaceGuid, [user])
          .then(function () {
            expect(spaceModel.spaces[clusterGuid][spaceGuid].roles[user.metadata.guid]).toEqual([]);
          })
          .catch(function (error) {
            fail('removeFromSpace should have succeeded: ' + error);
          });

        $httpBackend.flush();
      });

    });

    describe('listUsers', function () {

      it('user is admin', function () {
        var promiseForUsers;

        var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
        _.set(stackatoInfo, 'info.endpoints.hcf.' + clusterGuid + '.user.admin', true);

        var usersModel = modelManager.retrieve('cloud-foundry.model.users');
        spyOn(usersModel, 'listAllUsers').and.callFake(function (inClusterGuid) {
          expect(inClusterGuid).toEqual(clusterGuid);
          var thisCall = Math.random();
          if (!promiseForUsers) {
            promiseForUsers = thisCall;
          }
          // Ensure this returns something unique every time, this will help determine if we're getting a cached
          // response back
          return thisCall;
        });

        expect(rolesService.listUsers(clusterGuid)).toEqual(promiseForUsers);
        expect(rolesService.listUsers(clusterGuid, false)).toEqual(promiseForUsers);
        expect(rolesService.listUsers(clusterGuid, true)).not.toEqual(promiseForUsers);
      });

      it('user is not admin', function () {
        var users;

        var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
        _.set(stackatoInfo, 'info.endpoints.hcf.' + clusterGuid + '.user.admin', false);

        _.set(organizationModel, 'organizations.' + clusterGuid + '.' + orgGuid, testModelOrg);

        spyOn(organizationModel, 'retrievingRolesOfAllUsersInOrganization').and.callFake(function (inClusterGuid, inOrgGuid) {
          expect(inClusterGuid).toEqual(clusterGuid);
          expect(inOrgGuid).toEqual(orgGuid);

          var clonedUser = _.cloneDeep(user);
          clonedUser.metadata.created_date = Math.random();

          if (!users) {
            users = [ clonedUser ];
          }

          // Ensure this returns something unique every time, this will help determine if we're getting a cached
          // response back
          return $q.resolve([ clonedUser ]);
        });

        rolesService.listUsers(clusterGuid).then(function (inUsers) {
          expect(inUsers).toEqual(users);
        });
        rolesService.listUsers(clusterGuid, false).then(function (inUsers) {
          expect(inUsers).toEqual(users);
        });
        rolesService.listUsers(clusterGuid, true).then(function (inUsers) {
          expect(inUsers).not.toEqual(users);
        });

      });

    });

  });

})();

