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
    '$stateParams',
    '$scope'
  ];

  /**
   * @name ApplicationController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $scope - the Angular $scope
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   * @property {number} tabIndex - index of active tab
   * @property {string} warningMsg - warning message for application
   */
  function ApplicationController(modelManager, $stateParams, $scope) {
    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.id = $stateParams.guid;
    this.init();
    this.warningMsg = gettext('The application needs to be restarted for highlighted variables to be added to the runtime.');
    this.appActions = [];

    $scope.$watch(function () {
      return that.model.application.summary.state;
    }, function (newState) {
      that.appActions.length = 0;

      var newActions = [
        {
          name: gettext('Launch App'),
          execute: function () {
            that.model.startApp(that.id);
          },
          disabled: newState === 'PENDING' || newState === 'STARTED'
        },
        {
          name: gettext('Stop'),
          execute: function () {
            that.model.stopApp(that.id);
          },
          disabled: newState === 'PENDING' || newState === 'STOPPED'
        },
        {
          name: gettext('Restart'),
          execute: function () {
            that.model.restartApp(that.id);
          },
          disabled: newState === 'PENDING'
        },
        {
          name: gettext('Delete'),
          execute: function () {
          }
        }
      ];

      if (newState === 'STOPPED') {
        newActions.push({
          name: gettext('Start'),
          execute: function () {
            that.model.startApp(that.id);
          },
          disabled: newState === 'PENDING' || newState !== 'STOPPED'
        });
      }

      [].push.apply(that.appActions, newActions);
    });
  }

  angular.extend(ApplicationController.prototype, {
    init: function () {
      this.model.getAppSummary(this.id);
      this.model.getAppStats(this.id);
    }
  });

})();
