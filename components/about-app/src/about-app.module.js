(function () {
  'use strict';

  angular
    .module('about-app', ['app'])
    .config(registerRoute)
    .run(register);

  function registerRoute($stateProvider) {
    $stateProvider.state('about-app', {
      url: '/about',
      templateUrl: 'about-app/about-app.html',
      controller: AboutAppController,
      controllerAs: 'aboutCtrl',
      data: {
        activeMenuState: 'about-app'
      }
    });
  }

  /**
   * @name AboutAppController
   * @constructor
   * @param {app.utils.appEventService} appEventService - the event bus service
   * @param {app.model.modelManager} modelManager - the model management service
   * @property {app.utils.appEventService} appEventService - the event bus service
   * @property {app.model.modelManager} modelManager - the model management service
   */
  function AboutAppController(appEventService, modelManager) {
    this.appEventService = appEventService;
    this.modelManager = modelManager;

    this.model = modelManager.retrieve('app.model.account');
    this.consoleInfo = modelManager.retrieve('app.model.consoleInfo');
  }

  function register(modelManager, appEventService) {
    return new AboutApp(modelManager, appEventService);
  }

  function AboutApp(modelManager, appEventService) {
    appEventService.$on(appEventService.events.LOGIN, function () {
      onLoggedIn();
    });

    function onLoggedIn() {
      var menu = modelManager.retrieve('app.model.navigation').bottomMenu;
      menu.addMenuItem('about-app', 'about-app', 'menu.about', undefined, 99, 'help_outline');
    }
  }

})();
