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
      controllerAs: 'AppsCtrl'
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
  function ApplicationsController(apiManager) {
    this.appsAPI = apiManager.retrieve('cloud-foundry.api.apps');
    this.apps = this.listApps();
  }

  angular.extend(ApplicationsController.prototype, {
    listApps: function () {
      return this.appsAPI.list();
    }
  });

})();
