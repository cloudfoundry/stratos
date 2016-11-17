(function () {
  'use strict';

  describe('organization-space-tile directive', function () {
    var $httpBackend, $uibModal, $q, element, controller, spaceModel, contextScope;

    var clusterGuid = 'guid';
    var organizationGuid = 'organizationGuid';
    var spaceGuid = 'spaceGuid';

    var space = {
      metadata: {
        guid: spaceGuid
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
    var organization = {
      metadata: {
        guid: organizationGuid
      },
      entity: {
        name: 'orgName'
      }
    };
    var modelOrganization = {
      spaces: [ space ],
      details: {
        org: organization
      }
    };

    var userGuid = 'userGuid';
    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $uibModal = $injector.get('$uibModal');
      $q = $injector.get('$q');
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

      var organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
      _.set(organizationModel, 'organizations.' + clusterGuid + '.' + organization.metadata.guid, _.cloneDeep(modelOrganization));

      spaceModel = modelManager.retrieve('cloud-foundry.model.space');
      _.set(spaceModel, 'spaces.' + clusterGuid + '.' + space.metadata.guid, _.cloneDeep(modelSpace));

      var spaceGuid = 'spaceGuid';

      var authModelOpts = {
        role: role,
        userGuid: userGuid,
        cnsiGuid: clusterGuid,
        spaceGuid: spaceGuid
      };

      mock.cloudFoundryModel.Auth.initAuthModel($injector, authModelOpts);

      $httpBackend.expectGET('/pp/v1/proxy/v2/spaces/' + space.metadata.guid + '/routes?results-per-page=1')
        .respond({
          total_results: 0
        });
      $httpBackend.expectGET('/pp/v1/proxy/v2/spaces/' + space.metadata.guid + '/service_instances?results-per-page=1')
        .respond({
          total_results: 0
        });

      var $compile = $injector.get('$compile');

      contextScope = $injector.get('$rootScope').$new();
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

      describe('Actions', function () {

        it('Rename space - valid input', function () {
          spyOn($uibModal, 'open').and.callFake(function (config) {
            expect(config.resolve.context().data.name).toEqual(space.entity.name);
            expect(config.resolve.context().data.spaceNames).toEqual([space.entity.name]);

            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise,
              result: $q.reject('ERROR')
            };
          });

          controller.actions[0].execute();
        });

        it('Rename Space - reject', function () {
          spyOn(spaceModel, 'updateSpace');
          expect(controller.cardData().title).toEqual(space.entity.name);
          spyOn($uibModal, 'open').and.callFake(function () {
            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise,
              result: $q.reject('ERROR')
            };
          });

          controller.actions[0].execute();
          contextScope.$digest();

          expect(spaceModel.updateSpace).not.toHaveBeenCalled();
          expect(controller.cardData().title).toEqual(space.entity.name);
        });

        it('Rename Space - invalid output', function () {
          spyOn(spaceModel, 'updateSpace');
          expect(controller.cardData().title).toEqual(space.entity.name);
          spyOn($uibModal, 'open').and.callFake(function (config) {
            config.resolve.context().submitAction({
              name: ''
            });

            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise,
              result: $q.resolve()
            };
          });

          controller.actions[0].execute();
          contextScope.$digest();

          expect(spaceModel.updateSpace).not.toHaveBeenCalled();
          expect(controller.cardData().title).toEqual(space.entity.name);
        });

        it('Rename Space - valid output, failed update', function () {
          spyOn(spaceModel, 'updateSpace').and.callFake(function (inClusterGuid, inOrgGuid, inSpaceGuid, inSpace) {
            expect(inClusterGuid).toEqual(clusterGuid);
            expect(inOrgGuid).toEqual(organizationGuid);
            expect(inSpaceGuid).toEqual(spaceGuid);
            expect(inSpace).toEqual({
              name: 'NEW_SPACE'
            });
            return $q.reject();
          });
          expect(controller.cardData().title).toEqual(space.entity.name);
          spyOn($uibModal, 'open').and.callFake(function (config) {
            config.resolve.context().submitAction({
              name: 'NEW_SPACE'
            });

            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise,
              result: $q.resolve()
            };
          });

          controller.actions[0].execute();
          contextScope.$digest();

          expect(spaceModel.updateSpace).toHaveBeenCalled();
          expect(controller.cardData().title).toEqual(space.entity.name);
        });

        it('Rename Space - valid output, successful update', function () {
          spyOn(spaceModel, 'updateSpace').and.callFake(function () {
            return $q.resolve();
          });
          expect(controller.cardData().title).toEqual(space.entity.name);
          spyOn($uibModal, 'open').and.callFake(function (config) {
            config.resolve.context().submitAction({
              name: 'NEW_SPACE'
            });

            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise,
              result: $q.resolve()
            };
          });

          controller.actions[0].execute();
          contextScope.$digest();

          expect(spaceModel.updateSpace).toHaveBeenCalled();
          expect(controller.cardData().title).toEqual('NEW_SPACE');
        });

      });
    });

    describe('initialise as non-admin user', function () {

      beforeEach(inject(function ($injector) {
        initController($injector, 'space_developer');
        $httpBackend.flush();
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
