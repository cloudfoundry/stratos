(function () {
  'use strict';

  describe('cloud-foundry space model', function () {
    var $httpBackend, spaceModel;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');
      spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('ListAllSpace', function () {
      var result;
      var ListAllSpaces = mock.cloudFoundryAPI.Spaces.ListAllSpaces();
      $httpBackend.whenGET(ListAllSpaces.url).respond(200, ListAllSpaces.response['200'].body);
      $httpBackend.expectGET(ListAllSpaces.url);
      expect(result).not.toBeDefined();
      spaceModel.listAllSpaces('guid', {}).then(function (resources) {
        result = resources;
      });
      $httpBackend.flush();
      expect(ListAllSpaces.response['200'].body).toBeDefined();
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });

    it('ListAllServicesForSpace', function () {
      var result;
      var ListAllServicesForSpaceWithSSO = mock.cloudFoundryAPI.Spaces.ListAllServicesForSpaceWithSSO('guid');
      $httpBackend.whenGET(ListAllServicesForSpaceWithSSO.url).respond(200, ListAllServicesForSpaceWithSSO.response['200'].body);
      $httpBackend.expectGET(ListAllServicesForSpaceWithSSO.url);
      expect(result).not.toBeDefined();
      spaceModel.listAllServicesForSpace('cnsiGuid', 'guid', {}).then(function (resources) {
        result = resources;
      });
      $httpBackend.flush();
      expect(ListAllServicesForSpaceWithSSO.response['200'].body).toBeDefined();
      expect(result).toBeDefined();
      expect(result.length).toBeDefined();
      expect(result.length).toBe(3);
      expect(result[0]._bindTarget).toBe('ROUTE');
      expect(result[1]._bindTarget).toBe('APP');
      expect(result[1]._bindTarget).toBe('APP');
    });
  });

})();
