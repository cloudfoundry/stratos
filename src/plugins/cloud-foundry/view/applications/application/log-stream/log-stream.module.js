(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.log-stream', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.log-stream', {
      url: '/log-stream',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/log-stream/log-stream.html',
      controller: ApplicationLogStreamController,
      controllerAs: 'applicationLogStreamCtrl'
    });
  }

  ApplicationLogStreamController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  /**
   * @name ApplicationLogStreamController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationLogStreamController(modelManager, $stateParams) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.id = $stateParams.guid;
  }

  angular.extend(ApplicationLogStreamController.prototype, {
  });

})();
