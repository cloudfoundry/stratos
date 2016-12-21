(function () {
  'use strict';

  describe('organization-summary-tile directive', function () {
    var $httpBackend, element, controller, notificationCalled;

    var clusterGuid = 'guid';
    var organizationGuid = 'organizationGuid';

    var organization = {
      metadata: {
        guid: organizationGuid,
        created_at: '2016-10-28T14:48:48Z',
        updated_at: null
      },
      entity: {
        name: organizationGuid,
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
        users: [],
        managers: [],
        billing_managers: [],
        auditors: []
      }
    };
    var modelOrganization = {
      details: {
        guid: organizationGuid,
        org: organization
      },
      spaces: ['test']
    };
    var organizationNames = [];
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
      },
      'app.view.notificationsService': {
        notify: function () {
          notificationCalled = true;
        }
      },
      $state: {
        go: angular.noop,
        get: function () {
          return {data: {}};
        },
        current:{
          ncyBreadcrumb: {
            parent: angular.noop
          }
        }
      }
    }));

    function initController($injector, role) {
      $httpBackend = $injector.get('$httpBackend');

      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      $stateParams.organization = organizationGuid;

      var modelManager = $injector.get('app.model.modelManager');

      var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
      _.set(organizationModel, 'organizations.' + clusterGuid + '.' + organizationGuid, modelOrganization);
      _.set(organizationModel, 'organizationNames.' + clusterGuid, [organizationGuid]);

      var spaceGuid = 'spaceGuid';
      var authModelOpts = {
        role: role,
        userGuid: userGuid,
        cnsiGuid: clusterGuid,
        spaceGuid: spaceGuid,
        orgGuid: organizationGuid
      };

      mock.cloudFoundryModel.Auth.initAuthModel($injector, authModelOpts);

      var $compile = $injector.get('$compile');

      var contextScope = $injector.get('$rootScope').$new();
      contextScope.clusterGuid = clusterGuid;
      contextScope.organization = modelOrganization;
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
    }

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('admin user', function () {

      beforeEach(inject(function ($injector) {
        initController($injector, 'admin');
      }));

      it('init', function () {
        expect(element).toBeDefined();
        expect(controller).toBeDefined();

        expect(controller.clusterGuid).toBe(clusterGuid);
        expect(controller.organizationGuid).toBe(organizationGuid);
        expect(controller.organization).toBeDefined();
        expect(controller.utils).toBeDefined();
        expect(controller.showCliCommands).toBeDefined();
        expect(controller.cardData).toBeDefined();
        expect(controller.getEndpoint).toBeDefined();
        expect(controller.keys).toBeDefined();
        expect(controller.actions).toBeDefined();
        expect(controller.actions.length).toEqual(2);
      });

      it('should have edit organization enabled', function () {
        expect(controller.actions[0].disabled).toBe(false);
      });

      it('should have delete organization disabled', function () {
        expect(controller.actions[1].disabled).toBe(true);
      });

      it('should send request when user edited organization', function () {
        $httpBackend.expectPUT('/pp/v1/proxy/v2/organizations/organizationGuid').respond(201, organization);
        $httpBackend.expectGET('/pp/v1/proxy/v2/organizations/organizationGuid/spaces?inline-relations-depth=1').respond(200, {resources: [] });

        var editOrgAction = controller.actions[0];
        var asynTaskDialog = editOrgAction.execute();
        asynTaskDialog.actionTask({
          name: 'org1'
        });
        $httpBackend.flush();
      });

      it('should send request when user deleted organization', function () {
        $httpBackend.expectDELETE('/pp/v1/proxy/v2/organizations/organizationGuid').respond(200, {});
        var deleteOrgAction = controller.actions[1];
        deleteOrgAction.execute();
        $httpBackend.flush();
        expect(notificationCalled).toBe(true);
      });
    });

    describe('non admin user', function () {

      beforeEach(inject(function ($injector) {
        initController($injector, 'space_developer');
      }));

      it('should have no actions', function () {
        if (controller.actions) {
          expect(controller.actions.length).toBe(0);
        } else {
          expect(controller.actions).not.toBeDefined();
        }
      });

    });
  });

})();
