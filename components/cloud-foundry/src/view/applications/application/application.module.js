(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application', [
      'cloud-foundry.view.applications.application.summary',
      'cloud-foundry.view.applications.application.log-stream',
      'cloud-foundry.view.applications.application.services',
      'cloud-foundry.view.applications.application.variables',
      'cloud-foundry.view.applications.application.versions'
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
   * @param {helion.framework.widgets.frameworkDetailView} frameworkDetailView - The console's frameworkDetailView service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $scope - the Angular $scope
   * @param {object} $window - the Angular $window service
   * @param {object} $q - the Angular $q service
   * @param {object} $interval - the Angular $interval service
   * @param {object} $interpolate - the Angular $interpolate service
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
   * @property {string} warningMsg - warning message for application
   * @property {object} frameworkDialogConfirm - the confirm dialog service
   */
  function ApplicationController(modelManager, appEventService, frameworkDialogConfirm, appUtilsService,
                                 cfAppCliCommands, frameworkDetailView, $stateParams, $scope, $window, $q, $interval,
                                 $interpolate, $state, cfApplicationTabs) {
    var that = this;

    this.$window = $window;
    this.$q = $q;
    this.$interval = $interval;
    this.$interpolate = $interpolate;
    this.appEventService = appEventService;
    this.frameworkDialogConfirm = frameworkDialogConfirm;
    this.frameworkDetailView = frameworkDetailView;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    this.authModel = modelManager.retrieve('cloud-foundry.model.auth');
    this.consoleInfo = modelManager.retrieve('app.model.consoleInfo');
    this.stacksModel = modelManager.retrieve('cloud-foundry.model.stacks');
    this.cnsiGuid = $stateParams.cnsiGuid;
    this.cfAppCliCommands = cfAppCliCommands;
    this.id = $stateParams.guid;
    // Do we have the application summary? If so ready = true. This should be renamed
    this.ready = false;
    this.pipelineReady = false;
    this.warningMsg = gettext('The application needs to be restarted for highlighted variables to be added to the runtime.');
    this.UPDATE_INTERVAL = 5000; // milliseconds
    this.cfApplicationTabs = cfApplicationTabs;

    // Clear any previous state in the application tabs service
    cfApplicationTabs.clearState();

    // Wait for parent state to be fully initialised
    appUtilsService.chainStateResolve('cf.applications', $state, _.bind(this.init, this));

    // When a modal interaction starts, stop the background polling
    this.removeModalStartListener = this.appEventService.$on(this.appEventService.events.MODAL_INTERACTION_START, function () {
      that.stopUpdate();
    });
    // When a modal interaction ends, resume the background polling
    this.removeModalEndListener = this.appEventService.$on(this.appEventService.events.MODAL_INTERACTION_END, function () {
      that.update().finally(function () {
        that.startUpdate();
      });
    });

    this.appActions = [
      {
        name: gettext('View App'),
        execute: function () {
          var routes = that.model.application.summary.routes;
          if (routes.length) {
            var route = routes[0];
            var path = angular.isUndefined(route.path) ? '' : '/' + route.path;
            var url = 'http://' + route.host + '.' + route.domain.name + path;
            that.$window.open(url, '_blank');
          }
        },
        disabled: true,
        id: 'launch',
        icon: 'helion-icon helion-icon-lg helion-icon-Launch'
      },
      {
        name: gettext('Stop'),
        id: 'stop',
        execute: function () {
          that.model.stopApp(that.cnsiGuid, that.id);
        },
        disabled: true,
        icon: 'helion-icon helion-icon-lg helion-icon-Halt-stop'
      },
      {
        name: gettext('Restart'),
        id: 'restart',
        execute: function () {
          that.model.restartApp(that.cnsiGuid, that.id);
        },
        disabled: true,
        icon: 'helion-icon helion-icon-lg helion-icon-Refresh'
      },
      {
        name: gettext('Delete'),
        id: 'delete',
        execute: function () {
          that.deleteApp();
        },
        disabled: true,
        icon: 'helion-icon helion-icon-lg helion-icon-Trash'
      },
      {
        name: gettext('Start'),
        id: 'start',
        execute: function () {
          that.model.startApp(that.cnsiGuid, that.id);
        },
        disabled: true,
        icon: 'helion-icon helion-icon-lg helion-icon-Play'
      },
      {
        name: gettext('CLI Instructions'),
        id: 'cli',
        execute: function () {

          var username = null;
          if (that.consoleInfo.info.endpoints) {
            username = that.consoleInfo.info.endpoints.hcf[that.model.application.cluster.guid].user.name;
          }
          that.cfAppCliCommands.show(that.model.application, username);
        },
        disabled: true,
        icon: 'helion-icon helion-icon-lg helion-icon-Command_line'
      }
    ];

    // On first load, hide all of the application actions
    this.onAppStateChange();

    $scope.$watch(function () {
      return that.model.application.state
        ? that.model.application.state.label + that.model.application.state.subLabel : undefined;
    }, function () {
      that.onAppStateChange();
    });

    $scope.$watch(function () {
      return that.model.application.summary.routes;
    }, function (newRoutes, oldRoutes) {
      if (angular.toJson(newRoutes) !== angular.toJson(oldRoutes)) {
        that.onAppRoutesChange(newRoutes);
      }
    });

    $scope.$on('$destroy', function () {
      that.removeModalStartListener();
      that.removeModalEndListener();
      that.scopeDestroyed = true;
      that.stopUpdate();
    });
  }

  angular.extend(ApplicationController.prototype, {
    init: function () {
      var that = this;
      this.ready = false;
      this.model.application.project = null;
      // Fetching flag onlt set initially - subsequent calls update the data, so we don't want to show a busy indicator
      // in those cases
      this.model.application.pipeline.fetching = true;
      this.model.getClusterWithId(this.cnsiGuid);

      var haveApplication = angular.isDefined(this.model.application) &&
        angular.isDefined(this.model.application.summary) &&
        angular.isDefined(this.model.application.state);

      // Block the automatic update until we've finished the first round
      var blockUpdate = [];

      if (haveApplication) {
        // If we already have an application - then we are ready to display straight away
        // the rest of the data we might need will load and update the UI incrementally
        this.ready = true;

        this.updateBuildPack();
        this.cfApplicationTabs.clearState();

        if (this.model.application.summary.state === 'STARTED') {
          blockUpdate.push(that.model.getAppStats(that.cnsiGuid, that.id).then(function () {
            that.model.onAppStateChange();
          }));
        }
      }

      // Only the org and space names are needed, these cane be displayed dynamically when fetched
      this.model.getAppDetailsOnOrgAndSpace(this.cnsiGuid, this.id);

      var appSummaryPromise = this.model.getAppSummary(this.cnsiGuid, this.id, false)
        .then(function () {
          that.updateBuildPack();
          that.cfApplicationTabs.clearState();

          // appUpdated requires summary.guid and summary.services which are only found in updated app summary
          blockUpdate.push(that.cfApplicationTabs.appUpdated(that.cnsiGuid, true));

          if (!haveApplication && that.model.application.summary.state === 'STARTED') {
            blockUpdate.push(that.model.getAppStats(that.cnsiGuid, that.id).then(function () {
              that.model.onAppStateChange();
            }));
          }
        })
        .then(function () {
          // Update stacks
          var stackGuid = that.model.application.summary.stack_guid;
          var listStacksP;
          if (!_.has(that.stacksModel, 'stacks.' + that.cnsiGuid + '.' + stackGuid)) {
            // Stacks haven't been fetched yet
            listStacksP = that.stacksModel.listAllStacks(that.cnsiGuid);
          } else {
            listStacksP = that.$q.resolve();
          }
          return listStacksP.then(function () {
            that.updateStackName();
          });
        })
        .finally(function () {
          that.ready = true;

          that.onAppStateChange();

          // Don't start updating until we have completed the first init
          // Don't create timer when scope has been destroyed
          if (!that.scopeDestroyed) {
            return that.$q.all(blockUpdate).finally(function () {
              // HSC-1410: Need to check again that the scope has not been destroyed
              if (!that.scopeDestroyed) {
                that.pipelineReady = true;
                that.onAppStateChange();
                that.startUpdate();
              }
            });
          }

        });

      // Only block on fetching the app summary, anything else is not required by child states... or is but watches for
      // value change
      return haveApplication ? this.$q.resolve() : appSummaryPromise;
    },

    /**
     * @function startUpdate
     * @description start updating application view
     * @public
     */
    startUpdate: function () {
      var that = this;
      if (!this.scheduledUpdate) {
        this.scheduledUpdate = this.$interval(function () {
          that.update();
        }, this.UPDATE_INTERVAL);
      }
    },

    /**
     * @function stopUpdate
     * @description stop updating application
     * @public
     */
    stopUpdate: function () {
      if (this.scheduledUpdate) {
        this.$interval.cancel(this.scheduledUpdate);
        delete this.scheduledUpdate;
      }
    },

    /**
     * @function update
     * @description update application
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    update: function () {
      if (this.updating) {
        return;
      }

      var that = this;

      this.updating = true;
      return this.$q.when()
        .then(function () {
          return that.updateSummary().then(function () {
            return that.cfApplicationTabs.appUpdated(that.cnsiGuid, true);
          });
        })
        .finally(function () {
          that.updateActions();
          that.updating = false;
        });
    },

    /**
     * @function updateSummary
     * @description update application summary
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    updateSummary: function () {
      var that = this;
      return this.model.getAppSummary(this.cnsiGuid, this.id, true).then(function () {
        that.updateBuildPack();
        that.updateStackName();
      });
    },

    updateBuildPack: function () {
      // Convenience property, rather than verbose html determine which build pack to use here. Also resolves issue
      // where ng-if expressions (with function) were not correctly updating after on scope application.summary
      // changed
      this.appBuildPack = this.model.application.summary.buildpack || this.model.application.summary.detected_buildpack;
    },
    updateStackName: function (stackGuid) {
      this.appStackName = _.get(this.stacksModel, 'stacks.' + this.cnsiGuid + '.' + this.model.application.summary.stack_guid + '.entity.name', stackGuid);
    },

    /**
     * @function updateState
     * @description update application state
     * @returns {promise} A resolved/rejected promise
     * @public
     */
    updateState: function () {
      return this.model.getAppStats(this.cnsiGuid, this.id);
    },

    deleteApp: function () {
      if (this.model.application.summary.services.length || this.model.application.summary.routes.length) {
        var data = {
          cnsiGuid: this.cnsiGuid,
          project: _.get(this.model, 'application.project')
        };
        this.complexDeleteAppDialog(data);
      } else {
        this.simpleDeleteAppDialog();
      }
    },

    complexDeleteAppDialog: function (details) {
      this.frameworkDetailView(
        {
          template: '<delete-app-workflow guids="context.details" close-dialog="$close" dismiss-dialog="$dismiss"></delete-app-workflow>',
          title: gettext('Delete App, Pipeline, and Selected Items')
        },
        {
          details: details
        }
      );
    },

    simpleDeleteAppDialog: function () {
      var that = this;
      this.frameworkDialogConfirm({
        title: gettext('Delete Application'),
        description: gettext('Are you sure you want to delete ') + this.model.application.summary.name + '?',
        submitCommit: true,
        buttonText: {
          yes: gettext('Delete'),
          no: gettext('Cancel')
        },
        callback: function () {
          var appName = that.model.application.summary.name;
          that.model.deleteApp(that.cnsiGuid, that.id).then(function () {
            // show notification for successful binding
            var successMsg = gettext("'{{appName}}' has been deleted");
            var message = that.$interpolate(successMsg)({appName: appName});
            that.appEventService.$emit('events.NOTIFY_SUCCESS', {message: message});
            that.appEventService.$emit(that.appEventService.events.REDIRECT, 'cf.applications.list.gallery-view');
          });
        }
      });
    },

    /**
     * @function isActionHidden
     * @description determines if an application action should be hidden
     * @param {string} id - the id of the action
     * @returns {boolean} whether or not the action should be hidden
     */
    isActionHidden: function (id) {

      if (this.isCloudFoundryConsoleApplication()) {
        // App in question is CF
        return true;
      } else if (!this.model.application.state || !this.model.application.state.actions) {
        return true;
      } else {
        var hideAction = true;
        if (id === 'launch') {
          // isActionHidden is called on update. Ensure we check routes are ok here as well as in onAppRoutesChange
          hideAction = !_.get(this.model.application.summary.routes, 'length');
        } else {
          // Check permissions
          if (id === 'delete' ? _.get(this.model.application.pipeline, 'forbidden') : false) {
            // Hide delete if user has no project permissions
            hideAction = true;
          } else if (this.authModel.isInitialized(this.cnsiGuid)) {
            // Hide actions if user has no HCF app update perissions (i.e not a space developer)
            var spaceGuid = this.model.application.summary.space_guid;
            hideAction = !this.authModel.isAllowed(this.cnsiGuid,
              this.authModel.resources.application,
              this.authModel.actions.update,
              spaceGuid);
          }
        }

        return this.model.application.state.actions[id] !== true || hideAction;
      }
    },

    isCloudFoundryConsoleApplication: function () {
      // Check when running in cloud-foundry
      var cfInfo = this.consoleInfo.info ? this.consoleInfo.info['cloud-foundry'] : undefined;
      if (cfInfo) {
        return this.cnsiGuid === cfInfo.EndpointGUID &&
          this.model.application.summary.space_guid === cfInfo.SpaceGUID &&
          this.id === cfInfo.AppGUID;
      } else {
        return false;
      }
    },

    /**
     * @function isActionDisabled
     * @description Determine if an application action should be disabled
     * @param {string} id - the ID of the action
     * @returns {boolean} Whether or not the action should be disabled
     */
    isActionDisabled: function (id) {
      if (id === 'delete') {
        return !this.pipelineReady;
      } else {
        return false;
      }
    },

    /**
     * @function onAppStateChange
     * @description invoked when the application state changes, so we can update action visibility
     */
    onAppStateChange: function () {
      this.updateActions();
      this.onAppRoutesChange();
    },

    updateActions: function () {
      var that = this;
      angular.forEach(this.appActions, function (appAction) {
        appAction.disabled = that.isActionDisabled(appAction.id);
        appAction.hidden = that.isActionHidden(appAction.id);
      });
      this.visibleActions = _.find(this.appActions, {hidden: false});
    },

    /**
     * @function onAppRoutesChange
     * @description invoked when the application routes change, so we can update action visibility
     * @param {object=} newRoutes - application route metadata
     */
    onAppRoutesChange: function (newRoutes) {
      // Must have a route to be able to view an application
      var viewAction = _.find(this.appActions, {id: 'launch'});
      var hidden = this.isActionHidden(viewAction.id);
      if (!hidden) {
        var routes = _.isNil(newRoutes) ? this.model.application.summary.routes : newRoutes;
        hidden = _.isNil(routes) || routes.length === 0;
      }
      viewAction.hidden = hidden;
    }
  });

})();
