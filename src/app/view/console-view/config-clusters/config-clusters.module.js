(function () {
  'use strict';

  angular
    .module('app.view.config-clusters', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('config-clusters', {
      url: '/config/clusters',
      templateUrl: '/app/view/console-view/config-clusters/config-clusters.html',
      controller: ConfigClustersController,
      controllerAs: 'configClustersCtrl'
    });
  }

  ConfigClustersController.$inject = [
    'app.event.eventService',
    'app.model.modelManager'
  ];

  /**
   * @name ConfigClustersController
   * @constructor
   * @param {app.event.eventService} eventService - the event bus service
   * @param {app.model.modelManager} modelManager - the model management service
   * @property {app.event.eventService} eventService - the event bus service
   * @property {app.model.modelManager} modelManager - the model management service
   */
  function ConfigClustersController(eventService, modelManager) {
    this.eventService = eventService;
    this.modelManager = modelManager;
  }

  angular.extend(ConfigClustersController.prototype, {
  });

})();
