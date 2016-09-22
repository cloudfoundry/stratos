(function () {
  'use strict';

  describe('Manager Users test', function () {

    var $httpBackend, manageUsersService, organizationModel, authModel;

    var constants = {
      clusterGuid: 'clusterGuid',
      organizationGuid: 'organizationGuid',
      users: {
        user1: {
        },
        user2: {
        }
      },
      organizations: {
        organizationGuid : {
          details: {
            org: {
              metadata: {
                guid: 'organizationGuid'
              }
            }
          }
        },
        otherOrganizationGuid: {

        }
      }
    };

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      manageUsersService = $injector.get('app.view.endpoints.clusters.cluster.manageUsers');

      var modelManager = $injector.get('app.model.modelManager');
      organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
      authModel = modelManager.retrieve('cloud-foundry.model.auth');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(manageUsersService).toBeDefined();
      expect(manageUsersService.show).toBeDefined();
    });

    it('intialise', function () {
      // Set these to exercise more of the init. Should consider moving/better way of doing this in the future
      _.set(organizationModel, 'organizations.' + constants.clusterGuid, constants.organizations);
      _.set(authModel, 'principal.' + constants.clusterGuid + '.isAllowed.apply', _.noop);

      var modalObj = manageUsersService.show(constants.clusterGuid, constants.organizationGuid, constants.users);
      expect(modalObj.opened).toBeDefined();
    });
  });
})();
