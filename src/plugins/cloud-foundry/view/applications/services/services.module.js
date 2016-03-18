(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.services', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.services', {
      url: '/services/:guid',
      templateUrl: 'plugins/cloud-foundry/view/applications/services/services.html',
      controller: ApplicationsServicesController,
      controllerAs: 'applicationsServicesCtrl'
    });
  }

  ApplicationsServicesController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  /**
   * @name ApplicationsServicesController
   * @constructor
   * @param {app.model.modelManager} modelManager - the model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @property {object} model - the Cloud Foundry applications model
   * @property {string} id - the application GUID
   */
  function ApplicationsServicesController(modelManager, $stateParams) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.id = $stateParams.guid;
  }

  angular.extend(ApplicationsServicesController.prototype, {
  });

})();
