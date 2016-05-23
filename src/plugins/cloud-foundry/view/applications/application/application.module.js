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
      url: '/:guid',
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
    'helion.framework.widgets.dialog.confirm'
  ];

  /**
   * @name ApplicationController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.event.eventService} eventService - the event bus service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $scope - the Angular $scope
   * @param {object} confirmDialog - the confirm dialog service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {app.event.eventService} eventService - the event bus service
   * @property {string} id - the application GUID
   * @property {number} tabIndex - index of active tab
   * @property {string} warningMsg - warning message for application
   * @property {object} confirmDialog - the confirm dialog service
   */
  function ApplicationController(modelManager, eventService, $stateParams, $scope, confirmDialog) {
    var that = this;

    this.eventService = eventService;
    this.confirmDialog = confirmDialog;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.id = $stateParams.guid;
    this.init();
    this.warningMsg = gettext('The application needs to be restarted for highlighted variables to be added to the runtime.');
    this.isPending = this.model.application.summary.state === 'PENDING';
    this.appActions = [
      {
        name: gettext('Launch App'),
        execute: function () {
          that.model.launchApp(that.id);
        },
        disabled: this.isPending,
        icon: 'helion-icon helion-icon-lg helion-icon-Launch'
      },
      {
        name: gettext('Stop'),
        execute: function () {
          that.model.stopApp(that.id);
        },
        disabled: this.isPending,
        icon: 'helion-icon helion-icon-lg helion-icon-Halt-stop'
      },
      {
        name: gettext('Restart'),
        execute: function () {
          that.model.restartApp(that.id);
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
          that.model.startApp(that.id);
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
  }

  angular.extend(ApplicationController.prototype, {
    init: function () {
      this.model.getAppSummary(this.id);
      this.model.getAppStats(this.id);
    },

    deleteApp: function () {
      if (this.model.application.summary.services.length || this.model.application.summary.routes.length) {
        this.eventService.$emit('cf.events.START_DELETE_APP_WORKFLOW');
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
          that.model.deleteApp(that.id).then(function () {
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
    }
  });

})();
