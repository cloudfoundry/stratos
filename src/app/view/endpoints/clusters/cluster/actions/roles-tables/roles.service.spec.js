(function () {
  'use strict';

  describe('roles service', function () {

    var $httpBackend, rolesService, modelManager, $uibModal, organizationModel, spaceModel, authModel, testModelOrg, testModelSpace;

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
        space_developer: 'space_developer'
      }
    };

    var user = {
      metadata: {
        guid: userGuid
      }
    };

    var modelOrg = {
      details: {
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
    var modelSpace = {
      details: {
        space: {
          entity: {
            developers: [],
            managers: [],
            auditors: []
          }
        }
      },
      roles: {}
    };
    modelSpace.roles[userGuid] = [];

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      rolesService = $injector.get('app.view.endpoints.clusters.cluster.rolesService');
      modelManager = $injector.get('app.model.modelManager');
      $uibModal = $injector.get('$uibModal');

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

      organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
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

      it('cannot remove role if non-org_user roles exist', function () {
        testModelOrg.roles[userGuid].length = 0;
        testModelOrg.roles[userGuid].push(roleNames.org.org_user);
        testModelOrg.roles[userGuid].push(roleNames.org.org_manager);

        _.set(organizationModel, 'organizations.' + clusterGuid + '.' + orgGuid, testModelOrg);
        _.set(spaceModel, 'spaces.' + clusterGuid, {});
        expect(rolesService.canRemoveOrgRole(roleNames.org.org_user, clusterGuid, orgGuid, userGuid)).toBeFalsy();
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

  });

})();
