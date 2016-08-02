(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application', [
      'cloud-foundry.view.applications.application.summary',
      'cloud-foundry.view.applications.application.log-stream',
      'cloud-foundry.view.applications.application.services',
      'cloud-foundry.view.applications.application.delivery-logs',
      'cloud-foundry.view.applications.application.delivery-pipeline',
      'cloud-foundry.view.applications.application.variables'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application', {
      url: '/:cnsiGuid/app/:guid',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/application.html',
      controller: ApplicationController,
      controllerAs: 'appCtrl'
    });
  }

  ApplicationController.$inject = [
    'app.model.modelManager',
    'app.event.eventService',
    '$stateParams',
    '$scope',
    '$window',
    '$q',
    '$interval',
    'helion.framework.widgets.dialog.confirm'
  ];

  /**
   * @name ApplicationController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.event.eventService} eventService - the event bus service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $scope - the Angular $scope
   * @param {object} $window - the Angular $window service
   * @param {object} $q - the Angular $q service
   * @param {object} $interval - the Angular $interval service
   * @param {object} confirmDialog - the confirm dialog service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {object} $window - the Angular $window service
   * @property {object} $q - the Angular $q service
   * @property {object} $interval - the Angular $interval service
   * @property {app.event.eventService} eventService - the event bus service
   * @property {string} id - the application GUID
   * @property {number} tabIndex - index of active tab
   * @property {string} warningMsg - warning message for application
   * @property {object} confirmDialog - the confirm dialog service
   */
  function ApplicationController(modelManager, eventService, $stateParams, $scope, $window, $q, $interval, confirmDialog) {
    var that = this;

    this.$window = $window;
    this.$q = $q;
    this.$interval = $interval;
    this.eventService = eventService;
    this.confirmDialog = confirmDialog;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    this.cnsiGuid = $stateParams.cnsiGuid;
    this.hceCnsi = null;
    this.id = $stateParams.guid;
    this.ready = false;
    this.warningMsg = gettext('The application needs to be restarted for highlighted variables to be added to the runtime.');
    this.UPDATE_INTERVAL = 5000; // milliseconds

    this.init();

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
        },
        disabled: true,
        icon: 'helion-icon helion-icon-lg helion-icon-Command_line'
      }
    ];

    $scope.$watch(function () {
      return that.model.application.summary.state;
    }, function (newState) {
      that.onAppStateChange(newState);
    });

    $scope.$watch(function () {
      return that.model.application.summary.routes;
    }, function (newRoutes) {
      that.onAppRoutesChange(newRoutes);
    });

    $scope.$on('$destroy', function () {
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
      this.model.getAppSummary(this.cnsiGuid, this.id, true)
        .then(function () {
          return that.model.getAppDetailsOnOrgAndSpace(that.cnsiGuid, that.id);
        })
        .then(function () {
          that.model.updateDeliveryPipelineMetadata(true)
            .then(function (response) {
              that.onUpdateDeliveryPipelineMetadata(response);
            });
        })
        .finally(function () {
          that.ready = true;
          // Don't start updating until we have completed the first init
          // Don't create timer when scope has been destroyed
          if (!that.scopeDestroyed) {
            that.startUpdate();
          }
        });
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
     * @public
     */
    update: function () {
      if (this.updating) {
        return;
      }

      var that = this;

      this.updating = true;
      this.$q.when()
        .then(function () {
          that.updateSummary().then(function () {
            that.model.updateDeliveryPipelineMetadata()
              .then(function (response) {
                that.onUpdateDeliveryPipelineMetadata(response);
              });
          });
        })
        .finally(function () {
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
        // Convenience property, rather than verbose html determine which build pack to use here. Also resolves issue
        // where ng-if expressions (with function) were not correctly updating after on scope application.summary
        // changed
        that.appBuildPack = that.model.application.summary.buildpack ||
          that.model.application.summary.detected_buildpack;
      });
    },

    /**
     * @function onUpdateDeliveryPipelineMetadata
     * @description Set project when delivery pipeline metadata is updated
     * @param {object} pipeline - the delivery pipeline data
     * @returns {void}
     * @private
     */
    onUpdateDeliveryPipelineMetadata: function (pipeline) {
      var that = this;
      if (pipeline.valid) {
        this.hceCnsi = pipeline.hceCnsi;
        this.hceModel.getProjects(pipeline.hceCnsi.guid)
          .then(function () {
            that.model.application.project = that.hceModel.getProject(that.model.application.summary.name);
          });
      }
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
        var guids = {
          cnsiGuid: this.cnsiGuid,
          hceCnsiGuid: this.hceCnsi ? this.hceCnsi.guid : ''
        };
        this.eventService.$emit('cf.events.START_DELETE_APP_WORKFLOW', guids);
      } else {
        this.simpleDeleteAppDialog();
      }
    },

    simpleDeleteAppDialog: function () {
      var that = this;
      this.confirmDialog({
        title: gettext('Delete Application'),
        description: gettext('Are you sure you want to delete ') + this.model.application.summary.name + '?',
        buttonText: {
          yes: gettext('Delete'),
          no: gettext('Cancel')
        },
        callback: function () {
          that.model.deleteApp(that.cnsiGuid, that.id).then(function () {
            that.eventService.$emit(that.eventService.events.REDIRECT, 'cf.applications.list.gallery-view');
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
      if (!this.model.application.state || !this.model.application.state.actions) {
        return true;
      } else {
        return this.model.application.state.actions[id] !== true;
      }
    },

    /**
     * @function onAppStateChange
     * @description invoked when the application state changes, so we can update action visibility
     */
    onAppStateChange: function () {
      var that = this;
      angular.forEach(this.appActions, function (appAction) {
        appAction.disabled = false;
        appAction.hidden = that.isActionHidden(appAction.id);
      });
      this.onAppRoutesChange();
    },

    /**
     * @function onAppStateChange
     * @description invoked when the application routes change, so we can update action visibility
     * @param {object} newRoutes - application route metadata
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
