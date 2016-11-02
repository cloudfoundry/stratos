(function () {
  'use strict';

  describe('cluster-actions and unique-space-name directives', function () {
    var $httpBackend, element, $compile, $scope, clusterActionsCtrl;

    var userGuid = 'userGuid';

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(module({
      'app.utils.utilsService': {
        chainStateResolve: function (state, $state, init) {
          init();
        }
      }
    }));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $compile = $injector.get('$compile');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    var inputClusterGuid = 'guid';

    var modelOrganization = {
      details: {
        guid: 'orgGuid1'
      },
      spaces: [{
        entity: {
          name: 'space1Name'
        }
      }]
    };

    function initAuthModel(type, $injector) {
      // Initialise auth model appropriately
      var spaceGuid = 'spaceGuid';

      var authModelOpts = {
        role: type,
        userGuid: userGuid,
        cnsiGuid: inputClusterGuid,
        spaceGuid: spaceGuid
      };

      mock.cloudFoundryModel.Auth.initAuthModel($injector, authModelOpts);

      $scope = $injector.get('$rootScope').$new();
      var $stateParams = $injector.get('$stateParams');
      $stateParams.guid = 'guid';
      $stateParams.organization = modelOrganization.details.guid;
      $scope.$stateParams = $stateParams;
      var markup = '<cluster-actions></cluster-actions>';
      element = angular.element(markup);
      $compile(element)($scope);
      $scope.$apply();
      clusterActionsCtrl = element.controller('clusterActions');
    }

    describe('cluster-actions', function () {
      var $uibModal, $q, organizationModel, spaceModel, assignUsersService;

      var modelOrganization2 = {
        details: {
          guid: 'orgGuid2'
        },
        spaces: [{
          entity: {
            name: 'space2Name'
          }
        }]
      };

      beforeEach(inject(function ($injector) {
        $uibModal = $injector.get('$uibModal');

        $q = $injector.get('$q');

        var modelManager = $injector.get('app.model.modelManager');
        organizationModel = modelManager.retrieve('cloud-foundry.model.organization');
        _.set(organizationModel, 'organizations.' + inputClusterGuid + '.' + modelOrganization.details.guid, modelOrganization);
        _.set(organizationModel, 'organizations.' + inputClusterGuid + '.' + modelOrganization2.details.guid, modelOrganization2);

        spaceModel = modelManager.retrieve('cloud-foundry.model.space');

        assignUsersService = $injector.get('app.view.endpoints.clusters.cluster.assignUsers');

        initAuthModel('admin', $injector);
      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
        expect(clusterActionsCtrl).toBeDefined();
      });

      it('action count', function () {
        expect(clusterActionsCtrl.clusterActions).toBeDefined();
        expect(clusterActionsCtrl.clusterActions.length).toBe(3);
      });

      describe('Create Space', function () {
        var inputSpaceName = 'addedSpace';

        it('execute - cancel', function () {
          spyOn($uibModal, 'open').and.callFake(function (config) {
            // Ensure that if we were called we'd hit createSpace
            _.set(config.resolve.context().data.spaces, ['addedSpace']);

            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise,
              result: $q.reject()
            };
          });
          spyOn(spaceModel, 'createSpaces');

          clusterActionsCtrl.clusterActions[1].execute().result
            .then(function () {
              fail('A cancelled modal should not provide a resolved promised');
            })
            .catch(function () {
              expect(spaceModel.createSpaces).not.toHaveBeenCalled();
            });
        });

        it('execute - success', function () {

          spyOn($uibModal, 'open').and.callFake(function (config) {

            expect(config.resolve.context().data.existingSpaceNames).toEqual([modelOrganization.spaces[0].entity.name]);
            expect(config.resolve.context().data.isUserOrgManager()).toBeFalsy();

            // Ensure that if we were called we hit createSpace + have some data to pass through
            config.resolve.context().data.spaces = [inputSpaceName];
            config.resolve.context().data.organization = _.cloneDeep(modelOrganization);

            config.resolve.context().submitAction();

            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise,
              result: $q.resolve()
            };

          });
          spyOn(spaceModel, 'createSpaces').and.callFake(function (clusterGuid, orgGuid, spaceNames) {
            expect(clusterGuid).toEqual(inputClusterGuid);
            expect(orgGuid).toEqual(modelOrganization.details.guid);
            expect(spaceNames).toEqual([inputSpaceName]);
            return $q.resolve();
          });

          clusterActionsCtrl.clusterActions[1].execute();

          $scope.$digest();
          expect(spaceModel.createSpaces).toHaveBeenCalled();
        });

        it('setOrganization', function () {
          spyOn($uibModal, 'open').and.callFake(function (config) {
            config.resolve.context().data.organization = modelOrganization2;
            config.resolve.context().data.setOrganization();
            expect(config.resolve.context().data.existingSpaceNames).toEqual([modelOrganization2.spaces[0].entity.name]);

            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise
            };
          });

          clusterActionsCtrl.clusterActions[1].execute();
        });

        it('createSpaceDisabled', function () {
          spyOn($uibModal, 'open').and.callFake(function (config) {
            config.resolve.context().data.spaces = [inputSpaceName];
            expect(config.resolve.context().data.createSpaceDisabled()).toBeFalsy();

            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise
            };
          });

          clusterActionsCtrl.clusterActions[1].execute();
        });

        it('addSpace', function () {
          spyOn($uibModal, 'open').and.callFake(function (config) {
            config.resolve.context().data.spaces = [ 'test' ];
            expect(config.resolve.context().data.spaces.length).toBe(1);
            config.resolve.context().data.addSpace();
            expect(config.resolve.context().data.spaces.length).toBe(2);

            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise
            };
          });

          clusterActionsCtrl.clusterActions[1].execute();
        });
      });

      describe('Create Organization', function () {
        it('execute - cancel', function () {
          spyOn($uibModal, 'open').and.callFake(function () {
            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise,
              result: $q.reject()
            };
          });
          spyOn(organizationModel, 'createOrganization');

          clusterActionsCtrl.clusterActions[0].execute().result
            .then(function () {
              fail('A cancelled modal should not provide a resolved promised');
            })
            .catch(function () {
              expect(organizationModel.createOrganization).not.toHaveBeenCalled();
            });
        });

        it('execute - success', function () {

          var inputOrgName = 'testName';

          spyOn($uibModal, 'open').and.callFake(function (config) {

            config.resolve.context().submitAction({
              name: inputOrgName
            });

            return {
              opened: $q.defer().promise,
              closed: $q.defer().promise,
              rendered: $q.defer().promise,
              result: $q.resolve()
            };

          });
          spyOn(organizationModel, 'createOrganization').and.callFake(function (clusterGuid, orgName) {
            expect(clusterGuid).toEqual(inputClusterGuid);
            expect(orgName).toEqual(inputOrgName);
            return $q.resolve();
          });

          clusterActionsCtrl.clusterActions[0].execute();

          $scope.$digest();
          expect(organizationModel.createOrganization).toHaveBeenCalled();
        });
      });

      describe('Assign Users', function () {
        it('execute - cancel', function () {
          spyOn(assignUsersService, 'assign').and.callFake(function (input) {
            expect(input.clusterGuid).toEqual(inputClusterGuid);
            expect(input.selectedUsers).toBeDefined();
            return $q.reject();
          });

          clusterActionsCtrl.clusterActions[2].execute()
            .then(function () {
              fail('A cancelled assign should not provide a resolved promised');
            })
            .catch(function () {
              expect(assignUsersService.assign).toHaveBeenCalled();
            });
        });

        it('execute - success', function () {
          spyOn(assignUsersService, 'assign').and.callFake(function (input) {
            expect(input.clusterGuid).toEqual(inputClusterGuid);
            expect(input.selectedUsers).toBeDefined();
            return $q.resolve();
          });

          clusterActionsCtrl.clusterActions[2].execute()
            .then(function () {
              expect(assignUsersService.assign).toHaveBeenCalled();
            })
            .catch(function () {
              fail('A resolved assign should not provide a cancelled promised');
            });
        });
      });
    });

    describe('unique-space-name', function () {

      beforeEach(inject(function ($injector) {

        var contextScope = $injector.get('$rootScope').$new();
        contextScope.model = '';

        element = angular.element('<input unique-space-name ng-model="model"></input>');
        $compile(element)(contextScope);

      }));

      it('should be defined', function () {
        expect(element).toBeDefined();
      });
    });

    describe('cluster actions auth tests for admin', function () {

      beforeEach(inject(function ($injector) {
        initAuthModel('admin', $injector);
      }));

      it('should be defined', function () {
        expect(clusterActionsCtrl).toBeDefined();
      });

      it('should have create organization enabled', function () {
        expect(clusterActionsCtrl.clusterActions[0].disabled).toBe(false);
      });

      it('should have create space enabled', function () {
        expect(clusterActionsCtrl.clusterActions[1].disabled).toBe(false);
      });

      it('should have assign users enabled', function () {
        expect(clusterActionsCtrl.clusterActions[2].disabled).toBe(false);
      });
    });

    describe('cluster actions auth tests for non-admin space developer ', function () {

      beforeEach(inject(function ($injector) {
        initAuthModel('space_developer', $injector);
      }));

      it('should be defined', function () {
        expect(clusterActionsCtrl).toBeDefined();
      });

      it('should have create organization disabled', function () {
        expect(clusterActionsCtrl.clusterActions[0].disabled).toBe(true);
      });

      it('should have create space disabled', function () {
        expect(clusterActionsCtrl.clusterActions[1].disabled).toBe(true);
      });

      it('should have assign users disabled', function () {
        expect(clusterActionsCtrl.clusterActions[2].disabled).toBe(true);
      });
    });

  });

})();
