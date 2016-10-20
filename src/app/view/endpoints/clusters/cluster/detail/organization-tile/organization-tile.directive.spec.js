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
          spaces: [{
            metadata: {
              guid: 'spaceGuid'
            },
            entity: {
              organization_guid: 'orgGuid'
            }
          }]
        }
      }
    };
    var userGuid = 'userGuid';

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module({
      'helion.framework.widgets.asyncTaskDialog': function (content, context, actionTask) {
        return {
          content: content,
          context: context,
          actionTask: actionTask
        };
      },
      'helion.framework.widgets.dialog.confirm': function (spec) {
        return spec.callback();
      }
    }));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      var modelManager = $injector.get('app.model.modelManager');

      var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
      _.set(organizationModel, 'organizations.' + organization.cnsiGuid + '.' + organization.guid, modelOrganization);
      _.set(organizationModel, 'organizations.' + organization.cnsiGuid + '.' + organization.guid + '.details.org', '');
      _.set(organizationModel, 'organizationNames.' + organization.cnsiGuid, ['orgGuid']);

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

    it('should send request when user edited organization', function () {
      $httpBackend.expectPUT('/pp/v1/proxy/v2/organizations/orgGuid').respond(201, {});
      var editOrgAction = controller.actions[0];
      var asynTaskDialog = editOrgAction.execute();
      asynTaskDialog.actionTask({
        name: 'org1'
      });
      $httpBackend.flush();
    });

    it('should send request when user deleted organization', function () {
      $httpBackend.expectDELETE('/pp/v1/proxy/v2/organizations/orgGuid').respond(200, {});
      var deleteOrgAction = controller.actions[1];
      deleteOrgAction.execute();
      $httpBackend.flush();
    });

  });

})();
