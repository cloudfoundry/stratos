(function () {
  'use strict';

  describe('organization-summary-tile directive', function () {
    var $httpBackend, element, controller;

    var clusterGuid = 'clusterGuid';
    var organizationGuid = 'organizationGuid';

    var modelOrganization = {
      details: {
        guid: organizationGuid
      },
      spaces: []
    };
    var organizationNames = [];

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');

      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      $stateParams.organization = organizationGuid;

      var modelManager = $injector.get('app.model.modelManager');

      var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
      _.set(organizationModel, 'organizations.' + clusterGuid + '.' + organizationGuid, modelOrganization);

      var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
      _.set(stackatoInfo, 'info.endpoints.hcf.' + clusterGuid + '.user', {
        guid: 'user_guid',
        admin: true
      });

      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      _.set(authModel, 'principal.' + clusterGuid + '.isAllowed.apply', _.noop);

      var $compile = $injector.get('$compile');

      var contextScope = $injector.get('$rootScope').$new();
      contextScope.clusterGuid = clusterGuid;
      contextScope.organization = {};
      contextScope.organizationNames = organizationNames;

      var markup = '<organization-summary-tile ' +
        'cluster-guid="clusterGuid" ' +
        'organization="organization" ' +
        'organization-names="organizationNames">' +
        '</organization-summary-tile>';

      element = angular.element(markup);
      $compile(element)(contextScope);

      contextScope.$apply();
      controller = element.controller('organizationSummaryTile');
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
      expect(controller.organization).toBeDefined();
      expect(controller.utils).toBeDefined();
      expect(controller.cliCommands).toBeDefined();
      expect(controller.cardData).toBeDefined();
      expect(controller.getEndpoint).toBeDefined();
      expect(controller.keys).toBeDefined();
      expect(controller.actions).toBeDefined();
      expect(controller.actions.length).toEqual(2);

    });

  });

})();
