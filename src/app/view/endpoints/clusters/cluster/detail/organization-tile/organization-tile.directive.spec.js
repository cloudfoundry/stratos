(function () {
  'use strict';

  describe('organization-tile directive', function () {
    var $httpBackend, element, controller;

    var modelOrganization = {
      spaces: []
    };
    var organization = {
      cnsiGuid: 'guid',
      guid: 'orgGuid',
      org: {
        entity: {
          spaces: []
        }
      }
    };
    var userGuid = '0c97cd5a-8ef8-4f80-af46-acfa8697824e';

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');

      var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
      _.set(organizationModel, 'organizations.' + organization.cnsiGuid + '.' + organization.guid, modelOrganization);


      mock.cloudFoundryModel.Auth.initAuthModel('admin', userGuid, $injector);

      var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
      stackatoInfo = _.set(stackatoInfo, 'info.endpoints.hcf.' + organization.cnsiGuid + '.user', {
        guid: 'user_guid',
        admin: true
      });

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

    it('should have edit organisation enabled', function () {
      expect(controller.actions[0].disabled).toBeFalsy();
    });

    it('should have delete organisation enabled', function () {
      expect(controller.actions[1].disabled).toBeFalsy();
    });

    it('should have assign users enabled', function () {
      expect(controller.actions[2].disabled).toBeFalsy();
    });
  });

})();
