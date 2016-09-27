(function () {
  'use strict';

  describe('organization-tile directive', function () {
    var $httpBackend, element, controller;

    var modelOrganization = {
      spaces: []
    };
    var organization = {
      cnsiGuid: 'clusterGuid',
      guid: 'orgGuid',
      org: {
        entity: {
          spaces: []
        }
      }
    };

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');

      var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
      _.set(organizationModel, 'organizations.' + organization.cnsiGuid + '.' + organization.guid, modelOrganization);

      var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
      stackatoInfo = _.set(stackatoInfo, 'info.endpoints.hcf.' + organization.cnsiGuid + '.user', {
        guid: 'user_guid',
        admin: true
      });

      var authModel = modelManager.retrieve('cloud-foundry.model.auth');
      _.set(authModel, 'principal.' + organization.cnsiGuid + '.isAllowed.apply', _.noop);

      var $compile = $injector.get('$compile');

      var contextScope = $injector.get('$rootScope').$new();
      contextScope.organization = organization;
      contextScope.organizationNames = undefined;

      var markup = '<organization-tile ' +
        'organization="organization" ' +
        'organization-names="organizationNames">' +
        '</organization-tile>';

      element = angular.element(markup);
      $compile(element)(contextScope);

      contextScope.$apply();
      controller = element.controller('organizationTile');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be defined', function () {
      expect(element).toBeDefined();
      expect(controller).toBeDefined();
      expect(controller.memory).toBeDefined();
      expect(controller.instances).toBeDefined();
      expect(controller.summary).toBeDefined();
      expect(controller.getCardData).toBeDefined();
      expect(controller.actions).toBeDefined();
      expect(controller.actions.length).toEqual(3);
    });

  });

})();
