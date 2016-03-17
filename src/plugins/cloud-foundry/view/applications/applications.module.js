(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    //cf.applications:guid.show...
    $stateProvider.state('cf.applications', {
      url: '/applications',
      templateUrl: 'plugins/cloud-foundry/view/applications/applications.html',
      controller: ApplicationsController,
      controllerAs: 'applicationsCtrl'
    });
  }

  ApplicationsController.$inject = [
    'app.model.modelManager'
  ];

  /**
   * @name ApplicationsController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @property {object} application - the Cloud Foundry Applications Model
   */
  function ApplicationsController(modelManager) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.model.all();
    };

  angular.extend(ApplicationsController.prototype, {

  });

})();
