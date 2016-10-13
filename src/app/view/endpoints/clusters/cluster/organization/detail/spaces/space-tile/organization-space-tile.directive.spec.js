(function () {
  'use strict';

  describe('organization-space-tile directive', function () {
    var $httpBackend, element, controller;

    var clusterGuid = 'guid';
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

    var userGuid = 'userGuid';
    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    function initController($injector, role) {
      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = clusterGuid;
      $stateParams.organization = organizationGuid;

      var modelManager = $injector.get('app.model.modelManager');

      var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
      _.set(spaceModel, 'spaces.' + clusterGuid + '.' + space.metadata.guid, _.cloneDeep(modelSpace));

      mock.cloudFoundryModel.Auth.initAuthModel(role, userGuid, $injector);

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
    }

    describe('initialise as admin user', function () {

      beforeEach(inject(function ($injector) {
        initController($injector, 'admin');
        $httpBackend.flush();
      }));

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
      });

      it('should have rename space enabled', function () {
        expect(controller.actions[0].disabled).toBeFalsy();
      });

      it('should have delete space disabled', function () {
        expect(controller.actions[1].disabled).toBeTruthy();
      });

      it('should have assign users enabled', function () {
        expect(controller.actions[2].disabled).toBeFalsy();
      });
    });

    describe('initialise as non-admin user', function () {

      beforeEach(inject(function ($injector) {
        initController($injector, 'space_developer');
        $httpBackend.flush();
      }));

      afterEach(function () {
        $httpBackend.flush();
      });

      it('should have rename space disabled', function () {
        expect(controller.actions[0].disabled).toBeTruthy();
      });

      it('should have delete space disabled', function () {
        expect(controller.actions[1].disabled).toBeTruthy();
      });

      it('should have assign users disabled', function () {
        expect(controller.actions[2].disabled).toBeTruthy();
      });
    });
  });

})();
