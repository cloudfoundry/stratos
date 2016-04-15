(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications', [
      'cloud-foundry.view.applications.application',
      'cloud-foundry.view.applications.list'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications', {
      url: '/applications',
      controller: ApplicationsController,
      controllerAs: 'applicationsCtrl',
      templateUrl: 'plugins/cloud-foundry/view/applications/applications.html'
    });
  }

  ApplicationsController.$inject = [
    'app.model.modelManager'
  ];

  /**
   * @name ApplicationsController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {boolean} addingApplication - a flag indicating if adding an application
   */
  function ApplicationsController(modelManager) {
    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.addingApplication = false;

    this.addApplicationActions = {
      stop: function () {
        that.stopCreateApp();
      },
      finish: function () {
        that.finishCreateApp();
      }
    };
  }

  angular.extend(ApplicationsController.prototype, {

    startCreateApp: function () {
      this.addingApplication = true;
    },

    stopCreateApp: function () {
      this.addingApplication = false;
    },

    finishCreateApp: function () {
      this.addingApplication = false;
    }
  });

})();
