(function () {
  'use strict';

  angular
    .module('app.view.settings-page', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('account-settings', {
      url: '/account/settings',
      templateUrl: '/app/view/console-view/settings-page/settings-page.html',
      controller: SettingsController,
      controllerAs: 'settingsCtrl'
    });
  }

  SettingsController.$inject = [
    'app.event.eventService',
    'app.model.modelManager'
  ];

  /**
   * @name SettingsController
   * @constructor
   * @param {app.event.eventService} eventService - the event bus service
   * @param {app.model.modelManager} modelManager - the model management service
   * @property {app.event.eventService} eventService - the event bus service
   * @property {app.model.modelManager} modelManager - the model management service
   */
  function SettingsController(eventService, modelManager) {
    this.eventService = eventService;
    this.modelManager = modelManager;
  }

  angular.extend(SettingsController.prototype, {
  });

})();
