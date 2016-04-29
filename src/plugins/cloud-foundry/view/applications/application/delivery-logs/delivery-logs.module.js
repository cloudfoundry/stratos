(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.delivery-logs', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.delivery-logs', {
      url: '/delivery-logs',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/delivery-logs/delivery-logs.html',
      controller: ApplicationDeliveryLogsController,
      controllerAs: 'applicationDeliveryLogsCtrl'
    });
  }

  ApplicationDeliveryLogsController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  /**
   * @name ApplicationDeliveryLogsController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationDeliveryLogsController(modelManager, $stateParams) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.id = $stateParams.guid;
  }

  angular.extend(ApplicationDeliveryLogsController.prototype, {
  });

})();
