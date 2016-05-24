(function () {
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

    it('listAllPrivateDomains', function() {
      var result;
      var ListAllPrivateDomains = mock.cloudFoundryAPI.PrivateDomains.ListAllPrivateDomains();
      $httpBackend.whenGET(ListAllPrivateDomains.url).respond(200, ListAllPrivateDomains.response['200'].body);
      $httpBackend.expectGET(ListAllPrivateDomains.url);
      privateDomainModel.listAllPrivateDomains({}).then(function (resources) {
        result = resources;
      });
      $httpBackend.flush();
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });
  });

})();
