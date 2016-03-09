(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications', {
      url: '/applications',
      templateUrl: 'plugins/cloud-foundry/view/applications/applications.html',
      controller: ApplicationsController,
      controllerAs: 'ApplicationsController'
    });
  }

  ApplicationsController.$inject = [
    'app.api.apiManager'
  ];

  /**
   * @name ApplicationsController
   * @constructor
   * @param {app.api.apiManager.service} apiManager - the API management service
   * @property {object} appsAPI - the Cloud Foundry Apps API
   * @property {array} apps - List of applications
   */
  function ApplicationsController(modelManager) {
    this.application = modelManager.retrieve('cloud-foundry.model.application');
    this.applications = this.application.all();
  }

  angular.extend(ApplicationsController.prototype, {
  });

})();
