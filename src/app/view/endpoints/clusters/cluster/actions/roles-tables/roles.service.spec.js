(function () {
  'use strict';

  describe('roles service', function () {

    var $httpBackend, rolesService;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      rolesService = $injector.get('app.view.endpoints.clusters.cluster.rolesService')
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
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

  });

})();
