(function () {
  'use strict';

  describe('organization-space-tile directive', function () {
    var $httpBackend, element, controller;

    var clusterGuid = 'clusterGuid';
    var organizationGuid = 'organizationGuid';
    var space = {
      metadata: {
        guid: 'spaceGuid'
      },
      entity: {
        name: 'spaceName'
      }
    };
    var modelSpace = {
      details: {
        space: space
      }
    };

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      $stateParams.organization = organizationGuid;

      var modelManager = $injector.get('app.model.modelManager');

      var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
      _.set(spaceModel, 'spaces.' + clusterGuid + '.' + space.metadata.guid, modelSpace);

      var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
      stackatoInfo = _.set(stackatoInfo, 'info.endpoints.hcf.' + clusterGuid + '.user', {
        guid: 'user_guid',
        admin: true
      });

      $httpBackend.expectGET('/pp/v1/proxy/v2/spaces/' + space.metadata.guid + '/routes?results-per-page=1')
        .respond({
          total_results: 0
        });
      $httpBackend.expectGET('/pp/v1/proxy/v2/spaces/' + space.metadata.guid + '/service_instances?results-per-page=1')
        .respond({
          total_results: 0
        });

      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      _.set(authModel, 'principal.' + clusterGuid + '.isAllowed.apply', _.noop);
      _.set(authModel, 'principal.' + clusterGuid + '.userSummary.organizations.managed', []);
      _.set(authModel, 'principal.' + clusterGuid + '.userSummary.spaces.managed', []);

      var $compile = $injector.get('$compile');

      var contextScope = $injector.get('$rootScope').$new();
      contextScope.space = space;

      var markup = '<organization-space-tile ' +
        'space="space">' +
        '</organization-space-tile>';

      element = angular.element(markup);
      $compile(element)(contextScope);

      contextScope.$apply();
      controller = element.controller('organizationSpaceTile');
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
      expect(controller.spaceGuid).toBe(space.metadata.guid);
      expect(controller.actions).toBeDefined();
      expect(controller.actions.length).toEqual(3);
      expect(controller.summary).toBeDefined();
      expect(controller.spaceDetail).toBeDefined();
      expect(controller.orgDetails).toBeDefined();

      $httpBackend.flush();
    });

  });

})();
