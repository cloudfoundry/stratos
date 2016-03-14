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
    var that = this;
    this.application = modelManager.retrieve('cloud-foundry.model.application');
    this.application.all().then(function () {
        console.log(that.application.data.applications);
    });
  }

  angular.extend(ApplicationsController.prototype, {
  });

})();
