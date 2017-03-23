(function () {
  'use strict';

  describe('Assign Users test', function () {
    var assignUsersService, assignUsersController, $httpBackend, $uibModalInstance, $scope, modelManager,
      rolesService, $stateParams, $q, $timeout, $controller, stackatoInfo, organizationModel;

    var clusterGuid = 'clusterGuid';
    var organizationGuid = 'organizationGuid';
    var spaceGuid = 'spaceGuid';
    var selectedUsers = {userGuid1: true};

    var content = {
      clusterGuid: clusterGuid,
      organizationGuid: organizationGuid,
      spaceGuid: spaceGuid,
      selectedUsers: selectedUsers
    };

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {

      $httpBackend = $injector.get('$httpBackend');
      $uibModalInstance = {
        close: angular.noop,
        dismiss: angular.noop
      };

      $scope = $injector.get('$rootScope').$new();
      modelManager = $injector.get('app.model.modelManager');
      rolesService = $injector.get('app.view.endpoints.clusters.cluster.rolesService');
      $stateParams = $injector.get('$stateParams');
      organizationModel = $injector.get('organization-model');
      $q = $injector.get('$q');
      $timeout = $injector.get('$timeout');

      $controller = $injector.get('$controller');

      stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');

      assignUsersService = $injector.get('app.view.endpoints.clusters.cluster.assignUsers');

    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    function createBasicController(context) {
      assignUsersController = $controller('app.view.endpoints.clusters.cluster.assignUsersController', {
        $scope: $scope,
        modelManager: modelManager,
        context: context || {},
        rolesService: rolesService,
        $stateParams: $stateParams,
        $q: $q,
        $timeout: $timeout,
        $uibModalInstance: $uibModalInstance
      });
    }

    it('should be defined', function () {
      expect(assignUsersService).toBeDefined();
      expect(assignUsersService.assign).toBeDefined();

      createBasicController();
      expect(assignUsersController).toBeDefined();
    });

    it('should pass correct content spec to detailView', function () {
      // This will call initialiseSelect, so ensure it has all the shizzle to run
      _.set(stackatoInfo, 'info.endpoints.hcf.clusterGuid.user.admin', true);
      // User services list
      $httpBackend.whenGET('/pp/v1/proxy/v2/users?results-per-page=100').respond({ resources: []});

      var modalObj = assignUsersService.assign(content);

      $httpBackend.flush();

      expect(modalObj.opened).toBeDefined();
    });

    describe('Controller', function () {

      it('initialise', function () {
        createBasicController(content);

        expect(assignUsersController.options).toBeDefined();
        expect(assignUsersController.actions).toBeDefined();
        expect(assignUsersController.data).toBeDefined();
        expect(assignUsersController.userInput).toBeDefined();

        expect(assignUsersController.data.clusterGuid).toEqual(clusterGuid);
        expect(assignUsersController.data.organizationGuid).toEqual(organizationGuid);
        expect(assignUsersController.data.spaceGuid).toEqual(spaceGuid);

        expect(assignUsersController.userInput.selectedUsersByGuid).toEqual(selectedUsers);

        expect(assignUsersController.options.workflow).toBeDefined();
        expect(assignUsersController.options.workflow.steps).toBeDefined();
        expect(assignUsersController.options.workflow.steps.length).toEqual(2);

        expect(assignUsersController.actions.stop).toBeDefined();
        expect(assignUsersController.actions.finish).toBeDefined();

      });

      describe('post initialise', function () {

        var org1 = {
          spaces: [ {
            details: {
              space: {
                metadata: {
                  guid: 'spaceFromOrg1'
                }
              }
            }
          }],
          details: {
            guid: 'org1Guid',
            org: {
              metadata: {
                guid: 'org1Guid'
              },
              entity: {
                name: 'Beta'
              }
            }
          }
        };
        var org2 = {
          spaces: [ {
            details: {
              space: {
                metadata: {
                  guid: 'spaceFromOrg2'
                }
              }
            }
          }],
          details: {
            guid: 'org2Guid',
            org: {
              metadata: {
                guid: 'org2Guid'
              },
              entity: {
                name: 'Alpha'
              }
            }
          }
        };
        var organizations = {};
        organizations[org1.details.org.metadata.guid] = org1;
        organizations[org2.details.org.metadata.guid] = org2;
        var users = [
          {
            metadata: {
              guid: 'userAGuid'
            },
            entity: {
              username: 'userA'
            }
          },
          {
            metadata: {
              guid: 'userBGuid'
            },
            entity: {
              username: 'userB'
            }
          }
        ];

        describe('initialiseSelect', function () {

          beforeEach(function () {
            // This will call initialiseSelect, so ensure it has all the shizzle to run
            _.set(stackatoInfo, 'info.endpoints.hcf.clusterGuid.user.admin', true);
            // User services list
            $httpBackend.whenGET('/pp/v1/proxy/v2/users?results-per-page=100').respond({ resources: users });

            // Initial set of organizations
            _.set(organizationModel, 'organizations.' + clusterGuid, organizations);
          });

          it('should pass correct content spec to detailView', function () {
            // Allow all orgs
            var authModel = modelManager.retrieve('cloud-foundry.model.auth');
            spyOn(authModel, 'isOrgOrSpaceActionableByResource').and.callFake(function (inClusterguid) {
              expect(inClusterguid).toEqual(clusterGuid);
              return true;
            });

            createBasicController(content);
            assignUsersController.options.workflow.steps[0].checkReadiness();
            $httpBackend.flush();

            expect(assignUsersController.data.organizations).toEqual([
              {
                label: org2.details.org.entity.name,
                value: org2
              },
              {
                label: org1.details.org.entity.name,
                value: org1
              }
            ]);
            expect(assignUsersController.data.users).toEqual([ users[0], users[1] ]);
            var usersByGuid = {};
            usersByGuid[users[0].metadata.guid] = users[0];
            usersByGuid[users[1].metadata.guid] = users[1];
            expect(assignUsersController.data.usersByGuid).toEqual(usersByGuid);
          });

          it('should omit organizations that user does not have access to', function () {
            // Allow one org
            var authModel = modelManager.retrieve('cloud-foundry.model.auth');
            spyOn(authModel, 'isOrgOrSpaceActionableByResource').and.callFake(function (inClusterguid, org) {
              expect(inClusterguid).toEqual(clusterGuid);

              // The user only has permissions for the second org
              return org.details.org.metadata.guid === org2.details.org.metadata.guid;
            });

            createBasicController(content);
            assignUsersController.options.workflow.steps[0].checkReadiness();
            $httpBackend.flush();

            expect(assignUsersController.data.organizations).toEqual([
              {
                label: org2.details.org.entity.name,
                value: org2
              }
            ]);
          });
        });

        describe('on wizard next step', function () {

          function createCustomController(content) {
            content.organizationGuid =
            createBasicController(content);
            var orgs = _.map(organizations, function (obj) {
              return {
                label: obj.details.org.entity.name,
                value: obj
              };
            });
            _.set(assignUsersController, 'data.organizations', orgs);

          }

          it('selected users', function () {
            var selectedUsersByGuidInput = {
              userAGuid: false,
              userBGuid: true
            };
            var selectedUsersByGuidOutput = [ users[1] ];

            var alteredContent = _.cloneDeep(content);
            alteredContent.organizationGuid = org1.details.org.metadata.guid;
            createCustomController(alteredContent);
            _.set(assignUsersController, 'userInput.selectedUsersByGuid', selectedUsersByGuidInput);
            var usersByGuid = {};
            usersByGuid[users[0].metadata.guid] = users[0];
            usersByGuid[users[1].metadata.guid] = users[1];
            _.set(assignUsersController, 'data.usersByGuid', usersByGuid);

            assignUsersController.options.workflow.steps[0].onNext();

            expect(assignUsersController.userInput.selectedUsers).toEqual(selectedUsersByGuidOutput);
          });

          it('set default org when none pre-selected', function () {

            var alteredContent = _.cloneDeep(content);
            delete alteredContent.organizationGuid;
            createCustomController(alteredContent);

            assignUsersController.options.workflow.steps[0].onNext();

            expect(assignUsersController.userInput.org).toEqual(org1);
            expect(assignUsersController.data.spaces).toEqual(org1.spaces);
          });

          it('set default org when one pre-selected', function () {

            var alteredContent = _.cloneDeep(content);
            alteredContent.organizationGuid = org2.details.org.metadata.guid;
            createCustomController(alteredContent);

            assignUsersController.options.workflow.steps[0].onNext();

            expect(assignUsersController.userInput.org).toEqual(org2);
            expect(assignUsersController.data.spaces).toEqual(org2.spaces);
          });
        });

        describe('on wizard final step next', function () {

          it('roles service success', function () {
            var selectedOrgGuid = org2.details.org.metadata.guid;
            var roles = { a: 1};

            spyOn(rolesService, 'assignUsers').and.callFake(function (inClusterguid, inUsersByGuid, inSelectedOrgRoles) {
              // Also test we get the correct input as calculated via onNext
              expect(inClusterguid).toEqual(clusterGuid);
              expect(inUsersByGuid).toEqual(_.keyBy(users, 'metadata.guid'));
              expect(inSelectedOrgRoles).toEqual(_.set({}, selectedOrgGuid, roles));
              return $q.resolve();
            });

            _.set(assignUsersController, 'userInput.org.details.org.metadata.guid', selectedOrgGuid);
            _.set(assignUsersController, 'userInput.roles.' + selectedOrgGuid, roles);
            _.set(assignUsersController, 'userInput.selectedUsers', users);

            assignUsersController.options.workflow.steps[1].onNext().catch(function () {
              fail('onNext should have returned resolve promise');
            });

            $scope.$digest();
          });

          it('roles service failure', function () {
            spyOn(rolesService, 'assignUsers').and.callFake(function () {
              return $q.reject();
            });

            assignUsersController.options.workflow.steps[1].onNext().then(function () {
              fail('onNext should have returned rejected promise');
            });

            $scope.$digest();
          });
        });

        describe('actions', function () {

          beforeEach(function () {
            createBasicController(content);
          });

          it('stop', function () {
            spyOn(assignUsersController.$uibModalInstance, 'dismiss');
            assignUsersController.actions.stop();
            expect(assignUsersController.$uibModalInstance.dismiss).toHaveBeenCalled();
          });

          it('finish', function () {
            spyOn(assignUsersController.$uibModalInstance, 'close');

            assignUsersController.actions.finish();

            $scope.$digest();

            expect(assignUsersController.$uibModalInstance.close).toHaveBeenCalled();
          });
        });
      });
    });
  });
})();

