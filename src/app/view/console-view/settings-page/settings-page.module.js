(function () {
  'use strict';

  angular
    .module('app.view.settings-page', [])
    .config(registerRoute)
    .run(register);

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

    this.model = modelManager.retrieve('app.model.account');
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
  }

  angular.extend(SettingsController.prototype, {});

  register.$inject = [
    'app.model.modelManager',
    'app.event.eventService'
  ];

  function register(modelManager, eventService) {
    return new UserSettings(modelManager, eventService);
  }

  function UserSettings(modelManager, eventService) {
    var that = this;
    this.modelManager = modelManager;
    eventService.$on(eventService.events.LOGIN, function () {
      that.onLoggedIn();
    });
  }

  angular.extend(UserSettings.prototype, {
    onLoggedIn: function () {
      var menu = this.modelManager.retrieve('app.model.navigation').menu;
      menu.addMenuItem('settings', 'account-settings', gettext('Settings'), 99, 'helion-icon-Actions');
    }
  });

})();
