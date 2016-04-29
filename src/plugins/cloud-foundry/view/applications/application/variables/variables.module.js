(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.variables', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.variables', {
      url: '/variables',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/variables/variables.html',
      controller: ApplicationVariablesController,
      controllerAs: 'applicationVariablesCtrl'
    });
  }

  ApplicationVariablesController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  /**
   * @name ApplicationVariablesController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationVariablesController(modelManager, $stateParams) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.id = $stateParams.guid;
  }

  angular.extend(ApplicationVariablesController.prototype, {
  });

})();
