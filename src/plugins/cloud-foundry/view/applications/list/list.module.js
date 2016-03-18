(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.list', {
      url: '/list',
      templateUrl: 'plugins/cloud-foundry/view/applications/list/list.html',
      controller: ApplicationsListController,
      controllerAs: 'applicationsListCtrl'
    });
  }

  ApplicationsListController.$inject = [
    'app.model.modelManager'
  ];

  /**
   * @name ApplicationsListController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @property {object} application - the Cloud Foundry Applications Model
   */
  function ApplicationsListController(modelManager) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.model.all();
  }

  angular.extend(ApplicationsListController.prototype, {
  });

})();
