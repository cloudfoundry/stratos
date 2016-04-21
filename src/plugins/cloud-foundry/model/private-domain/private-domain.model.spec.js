(function () { // eslint-disable-line no-extra-parens, no-unused-expressions
  'use strict';

  describe('cloud-foundry private domain model', function () {
    var $httpBackend, privateDomainModel;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');
      privateDomainModel = modelManager.retrieve('cloud-foundry.model.private-domain');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('all', function() {
      var ListAllPrivateDomains = mock.cloudFoundryAPI.PrivateDomains.ListAllPrivateDomains();
      $httpBackend.when('GET', ListAllPrivateDomains.url).respond(200, ListAllPrivateDomains.response['200'].body);
      $httpBackend.expectGET(ListAllPrivateDomains.url);
      privateDomainModel.all();
      $httpBackend.flush();
      expect(privateDomainModel.data.all).toBe(ListAllPrivateDomains.response['200'].body);
    });

    it('filterByName', function() {
      var FilterPrivateDomainsByName = mock.cloudFoundryAPI.PrivateDomains.FilterPrivateDomainsByName();
      $httpBackend.when('GET', FilterPrivateDomainsByName.url).respond(200, FilterPrivateDomainsByName.response['200'].body);
      $httpBackend.expectGET(FilterPrivateDomainsByName.url);
      privateDomainModel.filterByName();
      $httpBackend.flush();
      expect(privateDomainModel.data.filtered).toBe(FilterPrivateDomainsByName.response['200'].body);
    });

    it('allSharedOrganizationsForPrivateDomain', function() {
      var ListAllSharedOrganizationsForPrivateDomain = mock.cloudFoundryAPI.PrivateDomains.ListAllSharedOrganizationsForPrivateDomain();
      $httpBackend.when('GET', ListAllSharedOrganizationsForPrivateDomain.url).respond(200, ListAllSharedOrganizationsForPrivateDomain.response['200'].body);
      $httpBackend.expectGET(ListAllSharedOrganizationsForPrivateDomain.url);
      privateDomainModel.allSharedOrganizationsForPrivateDomain();
      $httpBackend.flush();
      expect(privateDomainModel.data.allSharedOrg).toBe(ListAllSharedOrganizationsForPrivateDomain.response['200'].body);
    });

    it('retrievePrivateDomain', function() {
      var RetrievePrivateDomain = mock.cloudFoundryAPI.PrivateDomains.RetrievePrivateDomain();
      $httpBackend.when('GET', RetrievePrivateDomain.url).respond(200, RetrievePrivateDomain.response['200'].body);
      $httpBackend.expectGET(RetrievePrivateDomain.url);
      privateDomainModel.retrievePrivateDomain();
      $httpBackend.flush();
      expect(privateDomainModel.data.one).toBe(RetrievePrivateDomain.response['200'].body);
    });

  });
});
