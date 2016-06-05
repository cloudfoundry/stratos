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
   * @param {object} confirmDialog - the confirm dialog service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {object} $window - the Angular $window service
   * @property {app.event.eventService} eventService - the event bus service
   * @property {string} id - the application GUID
   * @property {number} tabIndex - index of active tab
   * @property {string} warningMsg - warning message for application
   * @property {object} confirmDialog - the confirm dialog service
   */
  function ApplicationController(modelManager, eventService, $stateParams, $scope, $window, confirmDialog) {
    var that = this;

    this.$window = $window;
    this.eventService = eventService;
    this.confirmDialog = confirmDialog;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.cnsiModel = modelManager.retrieve('app.model.serviceInstance');
    this.hceModel = modelManager.retrieve('cloud-foundry.model.hce');
    this.cnsiGuid = $stateParams.cnsiGuid;
    this.hceCnsi = null;
    this.id = $stateParams.guid;
    this.init();
    this.warningMsg = gettext('The application needs to be restarted for highlighted variables to be added to the runtime.');
    this.isPending = this.model.application.summary.state === 'PENDING';
    this.appActions = [
      {
        name: gettext('Launch App'),
        execute: function () {
          var routes = that.model.application.summary.routes;
          if (routes.length) {
            var route = routes[0];
            var path = angular.isUndefined(route.path) ? '/' + route.path : '';
            var url = 'http://' + route.host + '.' + route.domain.name + path;
            that.$window.open(url, '_blank');
          }
        },
        disabled: this.isPending,
        icon: 'helion-icon helion-icon-lg helion-icon-Launch'
      },
      {
        name: gettext('Stop'),
        execute: function () {
          that.model.stopApp(that.cnsiGuid, that.id);
        },
        disabled: this.isPending,
        icon: 'helion-icon helion-icon-lg helion-icon-Halt-stop'
      },
      {
        name: gettext('Restart'),
        execute: function () {
          that.model.restartApp(that.cnsiGuid, that.id);
        },
        disabled: this.isPending,
        icon: 'helion-icon helion-icon-lg helion-icon-Refresh'
      },
      {
        name: gettext('Delete'),
        execute: function () {
          that.deleteApp();
        },
        disabled: this.isPending,
        icon: 'helion-icon helion-icon-lg helion-icon-Trash'
      },
      {
        name: gettext('Start'),
        execute: function () {
          that.model.startApp(that.cnsiGuid, that.id);
        },
        disabled: this.isPending,
        icon: 'helion-icon helion-icon-lg helion-icon-Play'
      },
      {
        name: gettext('CLI Instructions'),
        execute: function () {
        },
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
  }

  angular.extend(ApplicationController.prototype, {
    init: function () {
      var that = this;
      this.model.getAppSummary(this.cnsiGuid, this.id);
      this.model.getAppStats(this.cnsiGuid, this.id);
      this.model.application.project = null;

      // TODO (kdomico): Get or create fake HCE user until HCE API is complete
      this.cnsiModel.list().then(function () {
        var hceCnsis = _.filter(that.cnsiModel.serviceInstances, { cnsi_type: 'hce' }) || [];
        if (hceCnsis.length > 0) {
          that.hceCnsi = hceCnsis[0];
          that.hceModel.getUserByGithubId(that.hceCnsi.guid, '123456')
            .then(function () {
              that.hceModel.getProjects(that.hceCnsi.guid)
                .then(function () {
                  that.model.application.project = that.hceModel.getProject(that.model.application.summary.name);
                });
            });
        }
      });
    },

    deleteApp: function () {
      if (this.model.application.summary.services.length || this.model.application.summary.routes.length) {
        var guids = { cnsiGuid: this.cnsiGuid, hceCnsiGuid: this.hceCnsi.guid };
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
            // delete project from HCE if it exists
            if (that.model.application.project) {
              that.hceModel.removeProject(that.hceCnsi.guid, that.model.application.project.id);
            }
            that.eventService.$emit(that.eventService.events.REDIRECT, 'cf.applications.list.gallery-view');
          });
        }
      });
    },

    onAppStateChange: function (newState) {
      var that = this;

      this.isPending = newState === 'PENDING';
      angular.forEach(this.appActions, function (appAction) {
        appAction.disabled = that.isPending;
      });

      this.appActions[1].hidden = newState === 'STOPPED';
      this.appActions[3].hidden = newState === 'STARTED';
      this.appActions[4].hidden = newState === 'STARTED';

      if (newState === 'STARTED' || newState === 'STOPPED') {
        this.init();
      }
    },

    onAppRoutesChange: function (newRoutes) {
      this.appActions[0].hidden = _.isNil(newRoutes) || newRoutes.length === 0;
    }
  });

})();
