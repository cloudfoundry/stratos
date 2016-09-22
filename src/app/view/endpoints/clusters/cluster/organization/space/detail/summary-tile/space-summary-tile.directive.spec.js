(function () {
  'use strict';

  describe('space-summary-tile directive', function () {
    var $httpBackend, element, controller;

    var clusterGuid = 'clusterGuid';
    var organizationGuid = 'organizationGuid';
    var spaceGuid = 'spaceGuid';

    var space = {
      details: {
        space: {
          metadata: {
            guid: spaceGuid
          }
        }
      }
    };

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      $stateParams.organization = organizationGuid;
      $stateParams.space = spaceGuid;

      var modelManager = $injector.get('app.model.modelManager');
      
      var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
      _.set(spaceModel, 'spaces.' + clusterGuid + '.' + spaceGuid, space);
      
      var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
      _.set(stackatoInfo, 'info.endpoints.hcf.' + clusterGuid + '.user', {
        guid: 'user_guid',
        admin: true
      });

      $httpBackend.expectGET('/pp/v1/proxy/v2/spaces/' + spaceGuid + '/routes?results-per-page=1')
        .respond({
          total_results: 0
        });
      $httpBackend.expectGET('/pp/v1/proxy/v2/spaces/' + spaceGuid + '/services?results-per-page=1')
        .respond({
          total_results: 0
        });

      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      _.set(authModel, 'principal.' + clusterGuid + '.isAllowed.apply', _.noop);

      var $compile = $injector.get('$compile');

      var contextScope = $injector.get('$rootScope').$new();
      contextScope.space = {};

      var markup = '<space-summary-tile ' +
        'space="space">' +
        '</space-summary-tile>';

      element = angular.element(markup);
      $compile(element)(contextScope);

      contextScope.$apply();
      controller = element.controller('spaceSummaryTile');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('init', function () {
      expect(element).toBeDefined();
      expect(controller).toBeDefined();

      expect(controller.clusterGuid).toBe(clusterGuid);
      expect(controller.organizationGuid).toBe(organizationGuid);
      expect(controller.spaceGuid).toBe(spaceGuid);
      expect(controller.space).toBeDefined();
      expect(controller.cardData).toBeDefined();
      expect(controller.actions).toBeDefined();
      expect(controller.actions.length).toEqual(2);
      expect(controller.getEndpoint).toBeDefined();
      expect(controller.showCliCommands).toBeDefined();
      expect(controller.spaceDetail).toBeDefined();

      $httpBackend.flush();
    });

  });

})();
