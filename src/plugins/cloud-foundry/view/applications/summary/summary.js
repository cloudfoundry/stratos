(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.summary', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.summary', {
      url: '/:guid',
      templateUrl: 'plugins/cloud-foundry/view/applications/summary/summary.html',
      controller: ApplicationsSummaryController,
      controllerAs: 'applicationsSummaryCtrl'
    });
  }

  ApplicationsSummaryController.$inject = [
    'app.model.modelManager',
    '$stateParams'
  ];

  /**
   * @name ApplicationsSummaryController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @property {object} application - the Cloud Foundry Applications Model
   */
  function ApplicationsSummaryController(modelManager, $stateParams) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.id = $stateParams.guid;
  }

  angular.extend(ApplicationsSummaryController.prototype, {
  });

})();
