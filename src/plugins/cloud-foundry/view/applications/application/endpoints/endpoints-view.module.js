(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.endpoints', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.endpoints-view', {
      url: '/endpoints-view',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/endpoints/endpoints-view.html',
      controller: EndpointsController,
      controllerAs: 'endpointsCtrl'
    });
  }

  EndpointsController.$inject = [
    'app.event.eventService',
    'app.model.modelManager'
  ];

  /**
   * @name EndpointsController
   * @constructor
   * @param {app.event.eventService} eventService - the event bus service
   * @param {app.model.modelManager} modelManager - the model management service
   */
  function EndpointsController(eventService, modelManager) {
    this.eventService = eventService;
    this.modelManager = modelManager;
    this.currentUserAccount = modelManager.retrieve('app.model.account');

  }

  angular.extend(EndpointsController.prototype, {
  });

})();
