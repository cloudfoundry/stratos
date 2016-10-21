(function () {
  'use strict';

  describe('organization-summary-tile directive', function () {
    var $httpBackend, element, controller, notificationCalled;

    var clusterGuid = 'guid';
    var organizationGuid = 'organizationGuid';

    var modelOrganization = {
      details: {
        guid: organizationGuid,
        org: {
          entity: {
            name: organizationGuid
          }
        }
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
      _.set(organizationModel, 'organizationNames.' + clusterGuid, ['orgGuid']);

      mock.cloudFoundryModel.Auth.initAuthModel(role, userGuid, $injector);

      var stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
      _.set(stackatoInfo, 'info.endpoints.hcf.' + clusterGuid + '.user', {
        guid: 'user_guid',
        admin: true
      });

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
        expect(controller.cliCommands).toBeDefined();
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
        $httpBackend.expectPUT('/pp/v1/proxy/v2/organizations/organizationGuid').respond(201, {
          entity: {
            name: organizationGuid
          }
        });
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

      it('should have edit organization disabled', function () {
        expect(controller.actions[0].disabled).toBe(true);
      });

      it('should have delete organization disabled', function () {
        expect(controller.actions[1].disabled).toBe(true);
      });

    });
  });

})();
