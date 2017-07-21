(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('addAppWorkflow', addAppWorkflow);

  /**
   * @memberof cloud-foundry.view.applications
   * @name addAppWorkflow
   * @description An add-app-workflow directive
   * @returns {object} The add-app-workflow directive definition object
   */
  function addAppWorkflow() {
    return {
      controller: AddAppWorkflowController,
      controllerAs: 'addAppWorkflowCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/add-app-workflow.html',
      scope: {
        closeDialog: '=',
        dismissDialog: '='
      },
      bindToController: true
    };
  }

  /**
   * @memberof cloud-foundry.view.applications
   * @name AddAppWorkflowController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.utils.appEventService} appEventService - the Event management service
   * @param {app.utils.appUtilsService} appUtilsService - the appUtilsService service
   * @param {object} cfUtilsService - utilities for cloud foundry
   * @param {object} $scope - Angular $scope
   * @param {object} $q - Angular $q service
   * @param {object} $translate - Angular $translate service
   * @property {boolean} addingApplication - flag for adding app
   * @property {object} userInput - user's input about new application
   * @property {object} options - workflow options
   */
  function AddAppWorkflowController(modelManager, appEventService, appUtilsService, cfUtilsService, $scope, $q,
                                    $translate) {

    var vm = this;

    vm.addingApplication = false;
    vm.userInput = {};
    vm.options = {};

    vm.reset = reset;
    vm.createApp = createApp;
    vm.validateNewRoute = validateNewRoute;
    vm.getAppsForSpace = getAppsForSpace;
    vm.getDomains = getDomains;
    vm.getPrivateDomains = getPrivateDomains;
    vm.getSharedDomains = getSharedDomains;
    vm.notify = notify;
    vm.startWorkflow = startWorkflow;
    vm.stopWorkflow = stopWorkflow;
    vm.finishWorkflow = finishWorkflow;

    var appModel = modelManager.retrieve('cloud-foundry.model.application');
    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance.user');
    var spaceModel = modelManager.retrieve('cloud-foundry.model.space');
    var routeModel = modelManager.retrieve('cloud-foundry.model.route');
    var privateDomainModel = modelManager.retrieve('cloud-foundry.model.private-domain');
    var sharedDomainModel = modelManager.retrieve('cloud-foundry.model.shared-domain');
    var authModel = modelManager.retrieve('cloud-foundry.model.auth');

    init();

    function init() {
      vm.stopWatchServiceInstance = $scope.$watch(function () {
        return vm.userInput.serviceInstance;
      }, function (serviceInstance) {
        if (serviceInstance) {
          vm.getDomains().then(function () {
            vm.userInput.domain = vm.options.domains[0] && vm.options.domains[0].value;
          });
        }
      });

      vm.stopWatchSpace = $scope.$watch(function () {
        return vm.userInput.space;
      }, function (space) {
        if (space) {
          vm.getAppsForSpace(space.metadata.guid);
        }
      });

      // Start the workflow
      vm.startWorkflow();
    }

    function reset() {
      vm.data = {};
      vm.errors = {};

      vm.userInput = {
        name: null,
        serviceInstance: null,
        clusterUsername: null,
        clusterPassword: null,
        organization: null,
        space: null,
        host: null,
        domain: null,
        application: null,
        cfApiEndpoint: null,
        cfUserName: null
      };

      vm.data.workflow = {
        hideStepNavStack: true,
        allowJump: false,
        allowBack: false,
        allowCancelAtLastStep: true,
        title: 'add-app-dialog.title',
        lastStepCommit: true,
        btnText: {
          cancel: 'buttons.cancel'
        },
        steps: [
          {
            templateUrl: 'plugins/cloud-foundry/view/applications/workflows/add-app-workflow/add-application.html',
            formName: 'application-name-form',
            btnText: {
              next: 'buttons.add',
              cancel: 'buttons.cancel'
            },
            showBusyOnNext: true,
            isLastStep: true,
            onEnter: function () {
              return serviceInstanceModel.list()
                .then(function (serviceInstances) {
                  var validServiceInstances = _.chain(_.values(serviceInstances))
                    .filter({cnsi_type: 'cf', valid: true})
                    .filter(function (cnsi) {
                      return authModel.doesUserHaveRole(cnsi.guid, authModel.roles.space_developer);
                    })
                    .map(function (o) {
                      return {label: o.name, value: o};
                    })
                    .value();
                  [].push.apply(vm.options.serviceInstances, validServiceInstances);
                });
            },
            onNext: function () {
              return vm.validateNewRoute().then(function () {
                return vm.createApp().then(function () {
                  appEventService.$emit('events.NOTIFY_SUCCESS', {
                    message: $translate.instant('add-app-dialog.step1.notifications.success',
                      {appName: vm.userInput.name})
                  });
                }, function (error) {
                  var msg = $translate.instant('add-app-dialog.step1.notifications.failure-part-1');
                  var cloudFoundryException = appUtilsService.extractCloudFoundryError(error);
                  if (cloudFoundryException || _.isString(error)) {
                    msg = $translate.instant('add-app-dialog.step1.notifications.failure-part-1-alt',
                      { error: cloudFoundryException || error});
                  }

                  msg = msg + $translate.instant('add-app-dialog.step1.notifications.failure-part-2');
                  return $q.reject(msg);
                });
              });
            }
          }
        ]
      };

      vm.data.countMainWorkflowSteps = vm.data.workflow.steps.length;

      vm.options = {
        workflow: vm.data.workflow,
        userInput: vm.userInput,
        errors: vm.errors,
        appEventService: appEventService,
        subflow: null,
        serviceInstances: [],
        services: [],
        servicesReady: false,
        organizations: [],
        spaces: [],
        domains: [],
        apps: []
      };

      vm.addApplicationActions = {
        stop: function () {
          vm.stopWorkflow();
        },

        finish: function () {
          vm.finishWorkflow();
        }
      };
    }

    /**
     * @function createApp
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description create an application
     * @returns {promise} A resolved/rejected promise
     */
    function createApp() {

      var cnsiGuid = vm.userInput.serviceInstance.guid;

      return appModel.createApp(cnsiGuid, {
        name: vm.userInput.name,
        space_guid: vm.userInput.space.metadata.guid
      }).then(function (app) {
        var summaryPromise = appModel.getAppSummary(cnsiGuid, app.metadata.guid);

        // Add route
        var routeSpec = {
          host: vm.userInput.host,
          domain_guid: vm.userInput.domain.metadata.guid,
          space_guid: vm.userInput.space.metadata.guid
        };

        var routePromise = routeModel.createRoute(cnsiGuid, routeSpec)
          .then(function (route) {
            return routeModel.associateAppWithRoute(cnsiGuid, route.metadata.guid, app.metadata.guid);
          });

        appEventService.$emit('cf.events.NEW_APP_CREATED');

        return $q.all([summaryPromise, routePromise]).then(function () {
          vm.userInput.application = appModel.application;
        });
      });
    }

    /**
     * @function validateNewRoute
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description check a route exists
     * @returns {promise} A resolved/rejected promise
     */
    function validateNewRoute() {

      return routeModel.checkRouteExists(
        vm.userInput.serviceInstance.guid,
        vm.userInput.domain.metadata.guid,
        vm.userInput.host
      )
        .then(function () {
          // Route has been found, this is not a valid route to add
          return $q.reject({
            exist: true
          });
        })
        .catch(function (error) {
          if (error && error.status === 404) {
            // Route has not been found, this is a valid route to add
            return $q.resolve();
          }

          if (error.exist) {
            return $q.reject($translate.instant('add-app-dialog.step1.route.exists'));
          }

          var msg = $translate.instant('add-app-dialog.step1.route.failure-part-1');
          var cloudFoundryException = appUtilsService.extractCloudFoundryError(error);
          if (cloudFoundryException || _.isString(error)) {
            msg = $translate.instant('add-app-dialog.step1.route.failure-part-1-alt',
              {error: cloudFoundryException || error});
          }

          msg = msg + $translate.instant('add-app-dialog.step1.route.failure-part-2');

          return $q.reject(msg);
        });
    }

    /**
     * @function getAppsForSpace
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description get apps for space
     * @param {string} guid - the space GUID
     * @returns {promise} A resolved/rejected promise
     */
    function getAppsForSpace(guid) {

      var cnsiGuid = vm.userInput.serviceInstance.guid;
      return spaceModel.listAllAppsForSpace(cnsiGuid, guid)
        .then(function (apps) {
          vm.options.apps.length = 0;
          [].push.apply(vm.options.apps, _.map(apps, cfUtilsService.selectOptionMapping));
        });
    }

    /**
     * @function getDomains
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description get domains, including private domains and shared domains
     * @returns {promise} A resolved/rejected promise
     */
    function getDomains() {
      vm.options.domains.length = 0;
      return $q.all([
        vm.getPrivateDomains(),
        vm.getSharedDomains()
      ]);
    }

    /**
     * @function getPrivateDomains
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description get private domains
     * @returns {promise} A resolved/rejected promise
     */
    function getPrivateDomains() {
      var cnsiGuid = vm.userInput.serviceInstance.guid;
      return privateDomainModel.listAllPrivateDomains(cnsiGuid).then(function (privateDomains) {
        [].push.apply(vm.options.domains, _.map(privateDomains, cfUtilsService.selectOptionMapping));
      });
    }

    /**
     * @function getSharedDomains
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description get shared domains
     * @returns {promise} A resolved/rejected promise
     */
    function getSharedDomains() {
      var cnsiGuid = vm.userInput.serviceInstance.guid;
      return sharedDomainModel.listAllSharedDomains(cnsiGuid).then(function (sharedDomains) {
        [].push.apply(vm.options.domains, _.map(sharedDomains, cfUtilsService.selectOptionMapping));
      });
    }

    /**
     * @function notify
     * @memberOf cloud-foundry.view.applications.AddAppWorkflowController
     * @description notify success
     */
    function notify() {
      if (!vm.userInput.application) {
        return;
      }

      var params = {
        cnsiGuid: vm.userInput.serviceInstance.guid,
        guid: vm.userInput.application.summary.guid,
        newlyCreated: true
      };

      appEventService.$emit(appEventService.events.REDIRECT, 'cf.applications.application.summary', params);
    }

    function startWorkflow() {
      vm.addingApplication = true;
      vm.reset();
    }

    function stopWorkflow() {
      vm.notify();
      vm.addingApplication = false;
      vm.closeDialog();
    }

    function finishWorkflow() {
      vm.notify();
      vm.addingApplication = false;
      vm.dismissDialog();
    }

  }

})();
