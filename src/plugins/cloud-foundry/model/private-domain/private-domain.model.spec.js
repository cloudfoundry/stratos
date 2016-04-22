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
      expect(privateDomainModel.data.all.total_results).toBe(ListAllPrivateDomains.response['200'].body.total_results);
      expect(privateDomainModel.data.all.prev_url).toBe(ListAllPrivateDomains.response['200'].body.prev_url);
      expect(privateDomainModel.data.all.next_url).toBe(ListAllPrivateDomains.response['200'].body.next_url);
      expect(privateDomainModel.data.all.resources[0].metadata.guid).toBe(ListAllPrivateDomains.response['200'].body.resources[0].metadata.guid);
    });

    it('filterByName', function() {
      var FilterPrivateDomainsByName = mock.cloudFoundryAPI.PrivateDomains.FilterPrivateDomainsByName();
      $httpBackend.when('GET', FilterPrivateDomainsByName.url).respond(200, FilterPrivateDomainsByName.response['200'].body);
      $httpBackend.expectGET(FilterPrivateDomainsByName.url);
      privateDomainModel.filterByName();
      $httpBackend.flush();
      expect(privateDomainModel.data.filtered.total_results).toBe(FilterPrivateDomainsByName.response['200'].body.total_results);
      expect(privateDomainModel.data.filtered.prev_url).toBe(FilterPrivateDomainsByName.response['200'].body.prev_url);
      expect(privateDomainModel.data.filtered.next_url).toBe(FilterPrivateDomainsByName.response['200'].body.next_url);
      expect(privateDomainModel.data.filtered.resources[0].metadata.guid).toBe(FilterPrivateDomainsByName.response['200'].body.resources[0].metadata.guid);
    });

    it('allSharedOrganizationsForPrivateDomain', function() {
      var ListAllSharedOrganizationsForPrivateDomain = mock.cloudFoundryAPI.PrivateDomains.ListAllSharedOrganizationsForPrivateDomain();
      $httpBackend.when('GET', ListAllSharedOrganizationsForPrivateDomain.url).respond(200, ListAllSharedOrganizationsForPrivateDomain.response['200'].body);
      $httpBackend.expectGET(ListAllSharedOrganizationsForPrivateDomain.url);
      privateDomainModel.allSharedOrganizationsForPrivateDomain();
      $httpBackend.flush();
      expect(privateDomainModel.data.allSharedOrg.total_results).toBe(ListAllSharedOrganizationsForPrivateDomain.response['200'].body.total_results);
      expect(privateDomainModel.data.allSharedOrg.prev_url).toBe(ListAllSharedOrganizationsForPrivateDomain.response['200'].body.prev_url);
      expect(privateDomainModel.data.allSharedOrg.next_url).toBe(ListAllSharedOrganizationsForPrivateDomain.response['200'].body.next_url);
      expect(privateDomainModel.data.allSharedOrg.resources[0].metadata.guid).toBe(ListAllSharedOrganizationsForPrivateDomain.response['200'].body.resources[0].metadata.guid);
    });

    it('retrievePrivateDomain', function() {
      var RetrievePrivateDomain = mock.cloudFoundryAPI.PrivateDomains.RetrievePrivateDomain();
      $httpBackend.when('GET', RetrievePrivateDomain.url).respond(200, RetrievePrivateDomain.response['200'].body);
      $httpBackend.expectGET(RetrievePrivateDomain.url);
      privateDomainModel.retrievePrivateDomain();
      $httpBackend.flush();
      expect(privateDomainModel.data.one.total_results).toBe(RetrievePrivateDomain.response['200'].body.total_results);
      expect(privateDomainModel.data.one.prev_url).toBe(RetrievePrivateDomain.response['200'].body.prev_url);
      expect(privateDomainModel.data.one.next_url).toBe(RetrievePrivateDomain.response['200'].body.next_url);
      expect(privateDomainModel.data.one.metadata.guid).toBe(RetrievePrivateDomain.response['200'].body.metadata.guid);
    });

  });

})();
