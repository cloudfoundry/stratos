(function () {
  'use strict';

  describe('organization-tile directive', function () {
    var $httpBackend, element, controller;

    var cnsiGuid = 'guid';
    var orgGuid = 'orgGuid';
    var spaceGuid = 'spaceGuid';

    var organization = {
      cnsiGuid: cnsiGuid,
      guid: orgGuid,
      org: {
        metadata: {
          guid: orgGuid,
          created_at: '2016-10-28T14:48:48Z',
          updated_at: null
        },
        entity: {
          name: 'delete-me',
          billing_enabled: false,
          quota_definition_guid: '84f213bb-ef1f-49ce-913b-3794905e32ee',
          status: 'active',
          quota_definition: {
            metadata: {
              guid: '84f213bb-ef1f-49ce-913b-3794905e32ee',
              created_at: '2016-10-28T12:54:11Z',
              updated_at: null
            },
            entity: {
              name: 'default',
              non_basic_services_allowed: true,
              total_services: 100,
              total_routes: 1000,
              total_private_domains: -1,
              memory_limit: 10240,
              trial_db_allowed: false,
              instance_memory_limit: -1,
              app_instance_limit: -1,
              app_task_limit: -1,
              total_service_keys: -1,
              total_reserved_route_ports: 0
            }
          },
          spaces: [],
          apps: [],
          users: [],
          managers: [],
          billing_managers: [],
          auditors: []
        }
      }
    };
    var modelOrganization = {
      details: {
        org: organization.org
      },
      spaces: []
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

      var organizationModel = $injector.get('organization-model');
      _.set(organizationModel, 'organizations.' + organization.cnsiGuid + '.' + organization.guid, modelOrganization);
      _.set(organizationModel, 'organizationNames.' + organization.cnsiGuid, ['orgGuid']);

      var authModelOpts = {
        role: 'admin',
        userGuid: userGuid,
        cnsiGuid: cnsiGuid,
        spaceGuid: spaceGuid,
        orgGuid: orgGuid
      };

      mock.cloudFoundryModel.Auth.initAuthModel($injector, authModelOpts);

      var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
      _.set(stackatoInfo, 'info.endpoints.hcf.' + organization.cnsiGuid + '.user', {
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
      $httpBackend.expectPUT('/pp/v1/proxy/v2/organizations/orgGuid').respond(201, organization.org);
      $httpBackend.expectGET('/pp/v1/proxy/v2/organizations/orgGuid/spaces?inline-relations-depth=1').respond(200, {resources: [] });

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
