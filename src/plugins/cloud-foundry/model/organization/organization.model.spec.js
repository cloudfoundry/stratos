(function () {
  'use strict';

  describe('cloud-foundry organization model', function () {
    var $httpBackend, organizationModel;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');
      organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('listAllOrganizations', function () {
      var result;
      var ListAllOrganizations = mock.cloudFoundryAPI.Organizations.ListAllOrganizations();
      $httpBackend.whenGET(ListAllOrganizations.url).respond(200, ListAllOrganizations.response['200'].body);
      $httpBackend.expectGET(ListAllOrganizations.url);
      expect(result).not.toBeDefined();
      organizationModel.listAllOrganizations('guid', {}).then(function (resources) {
        result = resources;
      });
      $httpBackend.flush();
      expect(ListAllOrganizations.response['200'].body['guid']).toBeDefined();
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });

    it('listAllSpacesForOrganization', function () {
      var result;
      var ListAllSpacesForOrganization = mock.cloudFoundryAPI.Organizations.ListAllSpacesForOrganization(123);
      $httpBackend.whenGET(ListAllSpacesForOrganization.url).respond(200, ListAllSpacesForOrganization.response['200'].body);
      $httpBackend.expectGET(ListAllSpacesForOrganization.url);
      expect(result).not.toBeDefined();
      organizationModel.listAllSpacesForOrganization('guid', 123).then(function (resources) {
        result = resources;
      });
      $httpBackend.flush();
      expect(ListAllSpacesForOrganization.response['200'].body['guid']).toBeDefined();
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });
  });

})();
