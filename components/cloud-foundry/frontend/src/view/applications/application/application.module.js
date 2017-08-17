(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application', [
      'cloud-foundry.view.applications.application.summary',
      'cloud-foundry.view.applications.application.log-stream',
      'cloud-foundry.view.applications.application.services',
      'cloud-foundry.view.applications.application.variables',
      'cloud-foundry.view.applications.application.events'
    ])
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application', {
      url: '/:cnsiGuid/app/:guid',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/application.html',
      controller: ApplicationController,
      controllerAs: 'appCtrl'
    });
  }

  /**
   * @name ApplicationController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.utils.appEventService} appEventService - the event bus service
   * @param {object} frameworkDialogConfirm - the confirm dialog service
   * @param {object} appUtilsService - the appUtilsService service
   * @param {object} cfAppCliCommands - the cfAppCliCommands dialog service
   * @param {app.framework.widgets.frameworkDetailView} frameworkDetailView - The console's frameworkDetailView service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $scope - the Angular $scope
   * @param {object} $window - the Angular $window service
   * @param {object} $q - the Angular $q service
   * @param {object} $interval - the Angular $interval service
   * @param {object} $translate - the Angular $translate service
   * @param {object} $state - the UI router $state service
   * @param {cfApplicationTabs} cfApplicationTabs - provides collection of configuration objects for tabs on the application page
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {object} $window - the Angular $window service
   * @property {object} $q - the Angular $q service
   * @property {object} $interval - the Angular $interval service
   * @property {object} $interpolate - the Angular $interpolate service
   * @property {app.utils.appEventService} appEventService - the event bus service
   * @property {string} id - the application GUID
   * @property {number} tabIndex - index of active tab
   * @property {object} frameworkDialogConfirm - the confirm dialog service
   */
  function ApplicationController(modelManager, appEventService, frameworkDialogConfirm, appUtilsService,
                                 cfAppCliCommands, frameworkDetailView, $stateParams, $scope, $window, $q, $interval,
                                 $translate, $state, cfApplicationTabs) {
    var vm = this;

    var authModel = modelManager.retrieve('cloud-foundry.model.auth');
    var consoleInfo = modelManager.retrieve('app.model.consoleInfo');
    var stacksModel = modelManager.retrieve('cloud-foundry.model.stacks');
    var cnsiGuid = $stateParams.cnsiGuid;
    var pipelineReady = false;
    var UPDATE_INTERVAL = 5000; // milliseconds

    var scopeDestroyed, updating;

    // Clear any previous state in the application tabs service
    cfApplicationTabs.clearState();

    // When a modal interaction starts, stop the background polling
    var removeModalStartListener = appEventService.$on(appEventService.events.MODAL_INTERACTION_START, function () {
      stopUpdate();
    });
    // When a modal interaction ends, resume the background polling
    var removeModalEndListener = appEventService.$on(appEventService.events.MODAL_INTERACTION_END, function () {
      update().finally(function () {
        startUpdate();
      });
    });

    vm.model = modelManager.retrieve('cloud-foundry.model.application');
    vm.id = $stateParams.guid;
    // Do we have the application summary? If so ready = true. This should be renamed
    vm.ready = false;
    vm.cfApplicationTabs = cfApplicationTabs;
    vm.appActions = [
      {
        name: 'app.app-info.app-actions.view',
        execute: function () {
          var routes = vm.model.application.summary.routes;
          if (routes.length) {
            var route = routes[0];
            var path = angular.isUndefined(route.path) ? '' : '/' + route.path;
            var url = 'http://' + route.host + '.' + route.domain.name + path;
            $window.open(url, '_blank');
          }
        },
        disabled: true,
        id: 'launch',
        icon: 'launch'
      },
      {
        name: 'app.app-info.app-actions.stop',
        id: 'stop',
        execute: function () {
          vm.model.stopApp(cnsiGuid, vm.id);
        },
        disabled: true,
        icon: 'stop'
      },
      {
        name: 'app.app-info.app-actions.restart',
        id: 'restart',
        execute: function () {
          vm.model.restartApp(cnsiGuid, vm.id);
        },
        disabled: true,
        icon: 'settings_backup_restore'
      },
      {
        name: 'app.app-info.app-actions.delete',
        id: 'delete',
        execute: function () {
          deleteApp();
        },
        disabled: true,
        icon: 'delete'
      },
      {
        name: 'app.app-info.app-actions.start',
        id: 'start',
        execute: function () {
          vm.model.startApp(cnsiGuid, vm.id);
        },
        disabled: true,
        icon: 'play_circle_outline'
      },
      {
        name: 'app.app-info.app-actions.cli',
        id: 'cli',
        execute: function () {

          var username = null;
          if (consoleInfo.info.endpoints) {
            username = consoleInfo.info.endpoints.cf[vm.model.application.cluster.guid].user.name;
          }
          cfAppCliCommands.show(vm.model.application, username);
        },
        disabled: true,
        icon: 'svg:Cli.svg',
        iconClass: 'app-action-icon-cli'
      }
    ];
    vm.scheduledUpdate = undefined;
    // Used in summary.module.js
    vm.update = update;
    vm.autoUpdate = {
      update: update,
      interval: UPDATE_INTERVAL,
      run: false
    };

    vm.isActionHidden = isActionHidden;

    // Clear any previous state in the application tabs service
    cfApplicationTabs.clearState();

    // Wait for parent state to be fully initialised
    appUtilsService.chainStateResolve('cf.applications', $state, _.bind(init, vm));

    // On first load, hide all of the application actions
    onAppStateChange();

    $scope.$watch(function () {
      return vm.model.application.state
        ? vm.model.application.state.label + vm.model.application.state.subLabel : undefined;
    }, function () {
      onAppStateChange();
    });

    $scope.$watch(function () {
      return vm.model.application.summary.routes;
    }, function (newRoutes, oldRoutes) {
      if (angular.toJson(newRoutes) !== angular.toJson(oldRoutes)) {
        onAppRoutesChange(newRoutes);
      }
    });

    $scope.$on('$destroy', function () {
      removeModalStartListener();
      removeModalEndListener();
      scopeDestroyed = true;
      stopUpdate();
    });

    function init() {
      vm.ready = false;
      vm.model.application.project = null;
      // Fetching flag onlt set initially - subsequent calls update the data, so we don't want to show a busy indicator
      // in those cases
      vm.model.application.pipeline.fetching = true;
      vm.model.getClusterWithId(cnsiGuid);

      var haveApplication = angular.isDefined(vm.model.application) &&
        angular.isDefined(vm.model.application.summary) &&
        angular.isDefined(vm.model.application.state);

      // Block the automatic update until we've finished the first round
      var blockUpdate = [];

      if (haveApplication) {
        // If we already have an application - then we are ready to display straight away
        // the rest of the data we might need will load and update the UI incrementally
        vm.ready = true;

        updateBuildPack();
        cfApplicationTabs.clearState();

        if (vm.model.application.summary.state === 'STARTED') {
          blockUpdate.push(vm.model.getAppStats(cnsiGuid, vm.id).then(function () {
            vm.model.onAppStateChange();
          }));
        }
      }

      // Only the org and space names are needed, these cane be displayed dynamically when fetched
      vm.model.getAppDetailsOnOrgAndSpace(cnsiGuid, vm.id);

      var appSummaryPromise = vm.model.getAppSummary(cnsiGuid, vm.id, false)
        .then(function () {
          updateBuildPack();
          cfApplicationTabs.clearState();

          // appUpdated requires summary.guid and summary.services which are only found in updated app summary
          blockUpdate.push(cfApplicationTabs.appUpdated(cnsiGuid, true));

          if (!haveApplication && vm.model.application.summary.state === 'STARTED') {
            blockUpdate.push(vm.model.getAppStats(cnsiGuid, vm.id).then(function () {
              vm.model.onAppStateChange();
            }));
          }
        })
        .then(function () {
          // Update stacks
          var stackGuid = vm.model.application.summary.stack_guid;
          var listStacksP;
          if (!_.has(stacksModel, 'stacks.' + vm.cnsiGuid + '.' + stackGuid)) {
            // Stacks haven't been fetched yet
            listStacksP = stacksModel.listAllStacks(vm.cnsiGuid);
          } else {
            listStacksP = $q.resolve();
          }
          return listStacksP.then(function () {
            updateStackName();
          });
        })
        .finally(function () {
          vm.ready = true;

          onAppStateChange();

          // Don't start updating until we have completed the first init
          // Don't create timer when scope has been destroyed
          if (!scopeDestroyed) {
            return $q.all(blockUpdate).finally(function () {
              // HSC-1410: Need to check again that the scope has not been destroyed
              if (!scopeDestroyed) {
                pipelineReady = true;
                onAppStateChange();
                startUpdate();
              }
            });
          }

        });

      // Only block on fetching the app summary, anything else is not required by child states... or is but watches for
      // value change
      return haveApplication ? $q.resolve() : appSummaryPromise;
    }

    /**
     * @function startUpdate
     * @description start updating application view
     * @public
     */
    function startUpdate() {
      vm.autoUpdate.run = true;
    }

    /**
     * @function stopUpdate
     * @description stop updating application
     * @public
     */
    function stopUpdate() {
      vm.autoUpdate.run = false;
    }

    /**
     * @function update
     * @description update application
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function update() {
      if (updating) {
        return $q.resolve();
      }

      updating = true;
      return $q.when()
        .then(function () {
          return updateSummary().then(function () {
            return cfApplicationTabs.appUpdated(cnsiGuid, true);
          });
        })
        .finally(function () {
          updateActions();
          updating = false;
        });
    }

    /**
     * @function updateSummary
     * @description update application summary
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    function updateSummary() {
      return vm.model.getAppSummary(cnsiGuid, vm.id, true).then(function () {
        updateBuildPack();
        updateStackName();
      });
    }

    function updateBuildPack() {
      // Convenience property, rather than verbose html determine which build pack to use here. Also resolves issue
      // where ng-if expressions (with function) were not correctly updating after on scope application.summary
      // changed
      vm.appBuildPack = vm.model.application.summary.buildpack || vm.model.application.summary.detected_buildpack;
    }

    function updateStackName(stackGuid) {
      vm.appStackName = _.get(stacksModel, 'stacks.' + vm.cnsiGuid + '.' + vm.model.application.summary.stack_guid + '.entity.name', stackGuid);
    }

    function deleteApp() {
      if (vm.model.application.summary.services.length || vm.model.application.summary.routes.length) {
        var data = {
          cnsiGuid: cnsiGuid,
          project: _.get(vm.model, 'application.project')
        };
        complexDeleteAppDialog(data);
      } else {
        simpleDeleteAppDialog();
      }
    }

    function complexDeleteAppDialog(details) {
      frameworkDetailView(
        {
          template: '<delete-app-workflow guids="context.details" close-dialog="$close" dismiss-dialog="$dismiss"></delete-app-workflow>',
          title: 'app.app-info.delete-app.complex.title',
          dialog: true,
          class: 'dialog-form-larger'
        },
        {
          details: details
        }
      );
    }

    function simpleDeleteAppDialog() {
      frameworkDialogConfirm({
        title: 'app.app-info.delete-app.simple.title',
        description: $translate.instant('app.app-info.delete-app.simple.description', { appName: vm.model.application.summary.name }),
        submitCommit: true,
        buttonText: {
          yes: 'app.app-info.delete-app.simple.button.yes',
          no: 'app.app-info.delete-app.simple.button.no'
        },
        callback: function () {
          var appName = vm.model.application.summary.name;
          vm.model.deleteApp(cnsiGuid, vm.id).then(function () {
            // show notification for successful binding
            var message = $translate.instant('app.app-info.delete-app.simple.success', {appName: appName});
            appEventService.$emit('events.NOTIFY_SUCCESS', {message: message});
            appEventService.$emit(appEventService.events.REDIRECT, 'cf.applications.list.gallery-view');
          });
        }
      });
    }

    /**
     * @function isActionHidden
     * @description determines if an application action should be hidden
     * @param {string} id - the id of the action
     * @returns {boolean} whether or not the action should be hidden
     */
    function isActionHidden(id) {

      if (isCloudFoundryConsoleApplication()) {
        // App in question is CF
        return true;
      } else if (!vm.model.application.state || !vm.model.application.state.actions) {
        return true;
      } else {
        var hideAction = true;
        if (id === 'launch') {
          // isActionHidden is called on update. Ensure we check routes are ok here as well as in onAppRoutesChange
          hideAction = !_.get(vm.model.application.summary.routes, 'length');
        } else {
          // Check permissions
          if (id === 'delete' ? _.get(vm.model.application.pipeline, 'forbidden') : false) {
            // Hide delete if user has no project permissions
            hideAction = true;
          } else if (authModel.isInitialized(cnsiGuid)) {
            // Hide actions if user has no CF app update perissions (i.e not a space developer)
            var spaceGuid = vm.model.application.summary.space_guid;
            hideAction = !authModel.isAllowed(cnsiGuid,
              authModel.resources.application,
              authModel.actions.update,
              spaceGuid);
          }
        }

        return vm.model.application.state.actions[id] !== true || hideAction;
      }
    }

    function isCloudFoundryConsoleApplication() {
      // Check when running in cloud-foundry
      var cfInfo = consoleInfo.info ? consoleInfo.info['cloud-foundry'] : undefined;
      if (cfInfo) {
        return cnsiGuid === cfInfo.EndpointGUID &&
          vm.model.application.summary.space_guid === cfInfo.SpaceGUID &&
          vm.id === cfInfo.AppGUID;
      } else {
        return false;
      }
    }

    /**
     * @function isActionDisabled
     * @description Determine if an application action should be disabled
     * @param {string} id - the ID of the action
     * @returns {boolean} Whether or not the action should be disabled
     */
    function isActionDisabled(id) {
      if (id === 'delete') {
        return !pipelineReady;
      } else {
        return false;
      }
    }

    /**
     * @function onAppStateChange
     * @description invoked when the application state changes, so we can update action visibility
     */
    function onAppStateChange() {
      updateActions();
      onAppRoutesChange();
    }

    function updateActions() {
      angular.forEach(vm.appActions, function (appAction) {
        appAction.disabled = isActionDisabled(appAction.id);
        appAction.hidden = isActionHidden(appAction.id);
      });
      vm.visibleActions = _.find(vm.appActions, { hidden: false });
    }

    /**
     * @function onAppRoutesChange
     * @description invoked when the application routes change, so we can update action visibility
     * @param {object=} newRoutes - application route metadata
     */
    function onAppRoutesChange(newRoutes) {
      // Must have a route to be able to view an application
      var viewAction = _.find(vm.appActions, {id: 'launch'});
      var hidden = isActionHidden(viewAction.id);
      if (!hidden) {
        var routes = _.isNil(newRoutes) ? vm.model.application.summary.routes : newRoutes;
        hidden = _.isNil(routes) || routes.length === 0;
      }
      viewAction.hidden = hidden;
    }
  }

})();
