(function () { // eslint-disable-line no-extra-parens, no-unused-expressions
  'use strict';

  describe('cloud-foundry shared domain model', function () {
    var $httpBackend, sharedDomainModel;
    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');
      sharedDomainModel = modelManager.retrieve('cloud-foundry.model.shared-domain');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('all', function() {
      var ListAllSharedDomains = mock.cloudFoundryAPI.SharedDomains.ListAllSharedDomains();
      $httpBackend.when('GET', ListAllSharedDomains.url).respond(200, ListAllSharedDomains.response['200'].body);
      $httpBackend.expectGET(ListAllSharedDomains.url);
      sharedDomainModel.all();
      $httpBackend.flush();
      expect(sharedDomainModel.data.all.total_results).toBe(ListAllSharedDomains.response['200'].body.total_results);
      expect(sharedDomainModel.data.all.total_pages).toBe(ListAllSharedDomains.response['200'].body.total_pages);
    });

    it('filterByName', function() {
      var FilterSharedDomainsByName = mock.cloudFoundryAPI.SharedDomains.FilterSharedDomainsByName();
      $httpBackend.when('GET', FilterSharedDomainsByName.url).respond(200, FilterSharedDomainsByName.response['200'].body);
      $httpBackend.expectGET(FilterSharedDomainsByName.url);
      sharedDomainModel.filterByName();
      $httpBackend.flush();
      expect(sharedDomainModel.data.filtered.total_results).toBe(FilterSharedDomainsByName.response['200'].body.total_results);
      expect(sharedDomainModel.data.filtered.total_pages).toBe(FilterSharedDomainsByName.response['200'].body.total_pages);
    });

    it('retrieveSharedDomain', function() {
      var RetrieveSharedDomain = mock.cloudFoundryAPI.SharedDomains.RetrieveSharedDomain();
      $httpBackend.when('GET', RetrieveSharedDomain.url).respond(200, RetrieveSharedDomain.response['200'].body);
      $httpBackend.expectGET(RetrieveSharedDomain.url);
      sharedDomainModel.retrieveSharedDomain();
      $httpBackend.flush();
      expect(sharedDomainModel.data.one.total_results).toBe(RetrieveSharedDomain.response['200'].body.total_results);
      expect(sharedDomainModel.data.one.total_pages).toBe(RetrieveSharedDomain.response['200'].body.total_pages);
    });

  });
})();
