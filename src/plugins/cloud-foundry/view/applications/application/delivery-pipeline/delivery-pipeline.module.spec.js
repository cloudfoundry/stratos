(function () {
  'use strict';

  describe('Delivery Pipeline', function () {

    var controller, $interpolate, $state, $stateParams, $rootScope, cnsiModel, userCnsiModel, notificationsService,
      modelManager, vcsTokenManager, PAT_DELIMITER, $httpBackend, account, utils, $q;

    beforeEach(module('green-box-console'));
    beforeEach(module({
      'app.utils.utilsService': {
        chainStateResolve: function (state, $state, init) {
          init();
        }
      }
    }));
    beforeEach(module('cloud-foundry.view.applications.application.delivery-pipeline'));

    // Define some common properties used throughout tests
    var application = {
      summary: {
        name: 'appName'
      },
      pipeline: {
        fetching: false
      }
    };

    var notificationTarget = {
      id: 10,
      name: 'test2',
      token: '5c424372c',
      type: 'slack1',
      location: 'test2',
      createdDate: null
    };

    var postDeployAction = {
      id: 10
    };

    var guid = '1';

    beforeEach(inject(function ($injector) {
      // Create the parameters required by the ctor
      $interpolate = $injector.get('$interpolate');
      $state = $injector.get('$state');
      $stateParams = $injector.get('$stateParams');
      modelManager = $injector.get('app.model.modelManager');
      vcsTokenManager = $injector.get('app.view.vcs.manageVcsTokens');
      PAT_DELIMITER = $injector.get('PAT_DELIMITER');

      // Some generic vars needed in tests
      $rootScope = $injector.get('$rootScope');
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');

      // Store the model functions that the constructor calls out to. These functions will be monitored and overwritten
      var model = modelManager.retrieve('cloud-foundry.model.application');
      _.set(model, 'application', application);
      cnsiModel = modelManager.retrieve('app.model.serviceInstance');
      userCnsiModel = modelManager.retrieve('app.model.serviceInstance.user');
      account = modelManager.retrieve('app.model.account');
      notificationsService = $injector.get('app.view.notificationsService');
      utils = $injector.get('app.utils.utilsService');
    }));

    function createController() {
      var ApplicationDeliveryPipelineController = $state.get('cf.applications.application.delivery-pipeline').controller;

      var detailView = function () {
        return {};
      };

      var confirmDialog = function () {
        return {
          result: {
            then: function (callback) {
              return callback();
            }
          }
        };
      };

      var addNotificationService = {
        add: function () {
          return {
            result: {
              then: function (callback) {
                return callback(notificationTarget);
              }
            }
          };
        }
      };

      var postDeployActionService = {
        add: function () {
          return {
            result: {
              then: function (callback) {
                return callback(postDeployAction);
              }
            }
          };
        }
      };

      var eventService = {
        $emit: angular.noop
      };

      $httpBackend.whenGET('/pp/v1/vcs/pat').respond(200, []);
      $httpBackend.whenGET('/pp/v1/vcs/clients').respond(200, []);

      // eventService, modelManager, vcsTokenManager, confirmDialog, addNotificationService, postDeployActionService, utils, PAT_DELIMITER, $interpolate, $stateParams, $scope, $q, $state, $log
      controller = new ApplicationDeliveryPipelineController(eventService, modelManager, vcsTokenManager, confirmDialog, notificationsService, addNotificationService, postDeployActionService, utils, detailView, PAT_DELIMITER, $interpolate, $stateParams, $rootScope.$new(), $q, $state);

      $httpBackend.flush();

      expect(controller).toBeDefined();
    }

    function createControllerWithPipelineMetadata() {
      account.accountData = {isAdmin: true};
      var application = {
        summary: {
          name: 'appName'
        },
        pipeline: {
          fetching: false,
          valid: true,
          hceCnsi: {
            guid: 'guid'
          },
          hceServiceGuid: guid
        },
        project: {
          id: guid,
          build_container_id: guid
        }
      };
      var model = modelManager.retrieve('cloud-foundry.model.application');
      _.set(model, 'application', application);

      var buildContainer = mock.hceApi.HceContainerApi.getBuildContainer(guid);
      $httpBackend.whenGET(buildContainer.url).respond(200, buildContainer.response['200']);

      var notificationTargets = mock.hceApi.HceNotificationApi.getNotificationTargets(guid);
      $httpBackend.whenGET(notificationTargets.url).respond(200, notificationTargets.response['200']);

      var notificationTargetTypes = mock.hceApi.HceNotificationApi.getNotificationTargetTypes();
      $httpBackend.whenGET(notificationTargetTypes.url).respond(200, notificationTargetTypes.response['200']);

      var pipelineTasks = mock.hceApi.HceProjectApi.getPipelineTasks(guid);
      $httpBackend.whenGET(pipelineTasks.url).respond(200, pipelineTasks.response['200']);

      createController();
    }

    afterEach(function () {
      // Not necessarily needed, but will catch any requests that have not been overwritten.
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Check HCE status', function () {
      it('Non-admin user with no services', function () {
        account.accountData = {isAdmin: false};
        createController();
        expect(controller.hceServices.fetching).toBe(false);
        expect(controller.hceServices.valid).toBe(0);
        expect(controller.hceServices.available).toBe(0);
        expect(controller.hceServices.isAdmin).toBe(false);
      });

      it('Admin user with no services', function () {
        account.accountData = {isAdmin: true};
        createController();
        expect(controller.hceServices.fetching).toBe(false);
        expect(controller.hceServices.valid).toBe(0);
        expect(controller.hceServices.available).toBe(0);
        expect(controller.hceServices.isAdmin).toBe(true);
      });

      it('User with valid services', function () {
        _.set(userCnsiModel, 'serviceInstances', {
          guid: {
            cnsi_type: 'hce',
            valid: true
          }
        });
        account.accountData = {isAdmin: true};
        createController();
        expect(controller.hceServices.fetching).toBe(false);
        expect(controller.hceServices.valid).toBe(1);
        expect(controller.hceServices.available).toBe(0);
        expect(controller.hceServices.isAdmin).toBe(true);
      });

      it('User with available and valid services', function () {
        _.set(cnsiModel, 'serviceInstances', {
          guid_1: {
            cnsi_type: 'hce'
          },
          guid_2: {
            cnsi_type: 'hce'
          }
        });
        _.set(userCnsiModel, 'serviceInstances', {
          guid_1: {
            cnsi_type: 'hce',
            valid: true
          },
          guid_2: {
            cnsi_type: 'hce',
            valid: false
          }
        });
        account.accountData = {isAdmin: true};
        createController();
        expect(controller.hceServices.fetching).toBe(false);
        expect(controller.hceServices.valid).toBe(1);
        expect(controller.hceServices.available).toBe(2);
        expect(controller.hceServices.isAdmin).toBe(true);
      });
    });

    describe('notification target & post-deploy', function () {

      beforeEach(function () {
        createControllerWithPipelineMetadata();
      });

      it('Pipeline data should be populated', function () {

        expect(controller.project.buildContainer).toBeDefined();
        expect(controller.notificationTargets.length).toBe(1);
        expect(controller.postDeployActions).toBeDefined();
      });

      it('should be able to add a new notification-target', function () {

        expect(controller.notificationTargets.length).toBe(1);
        controller.addNotificationTarget();
        expect(controller.notificationTargets.length).toBe(2);
      });

      it('should be able to add a new post-deploy task', function () {

        expect(controller.postDeployActions.length).toBe(0);
        controller.addPostDeployAction();
        expect(controller.postDeployActions.length).toBe(1);
      });
    });

    describe('delete pipleine', function () {

      beforeEach(function () {
        createControllerWithPipelineMetadata();
      });

      it('should be able to delete a pipeline', function () {

        // Expecting a DELETE project
        var deleteProject = mock.hceApi.HceProjectApi.deleteProject(guid);
        $httpBackend.expectDELETE(deleteProject.url).respond(201, deleteProject.response['201']);

        // List Projects after deleting
        var getProjects = mock.hceApi.HceProjectApi.getProjects();
        $httpBackend.expectGET(getProjects.url).respond(200, getProjects.response['200']);

        // Get Service bindings
        var listServiceBindings = mock.hceApi.UserProvidedServiceInstancesApi.ListAllServiceBindingsForUserProvidedServiceInstance(guid);
        $httpBackend.expectGET(listServiceBindings.url).respond(200, listServiceBindings.response['200']);

        // Delete service bindings
        var deleteServiceBinding = mock.cloudFoundryAPI.ServiceBindings.DeleteServiceBinding(guid);
        $httpBackend.expectDELETE(deleteServiceBinding.url).respond(200, deleteServiceBinding.response['200']);

        // Finally delete user-provided-service instance
        var deleteUserProvidedServiceBinding = mock.hceApi.UserProvidedServiceInstancesApi.DeleteUserProvidedServiceInstance(guid);
        $httpBackend.expectDELETE(deleteUserProvidedServiceBinding.url).respond(201, deleteUserProvidedServiceBinding.response['200']);

        controller.deletePipeline();
        $httpBackend.flush();
      });
    });
  });

})();
