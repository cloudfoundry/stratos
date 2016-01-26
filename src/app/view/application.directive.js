(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('application', application);

  application.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.application
   * @memberof app.view
   * @name application
   * @property {app.view.application.ApplicationController} controller - the application controller
   * @property {string} controllerAs - the application controller identifier
   * @property {string} templateUrl - the application template filepath
   */
  function application(path) {
    return {
      controller: ApplicationController,
      controllerAs: 'applicationCtrl',
      templateUrl: path + '/view/application.html'
    };
  }

  ApplicationController.$inject = [
    'app.event.eventService',
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.application.ApplicationController
   * @memberof app.view.application
   * @name ApplicationController
   * @param {app.event.eventService} eventService - the event bus service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.event.eventService} eventService - the event bus service
   * @property {app.model.account} account - the account model
   * @property {app.model.navigation} navigation - the navigation model
   */
  function ApplicationController(eventService, modelManager) {
    this.eventService = eventService;
    this.account = modelManager.retrieve('app.model.account');
    this.navigation = modelManager.retrieve('app.model.navigation');
  }

  angular.extend(ApplicationController.prototype, {
    /**
     * @function login
     * @memberof app.view.application.ApplicationController
     * @description Log in to the application
     * @param {string} name - the username
     * @emits LOGGED_IN
     */
    login: function (name) {
      this.account.login(name);
      this.navigation.reset();
      this.eventService.$emit(this.eventService.events.LOGGED_IN);
    },

    /**
     * @function logout
     * @memberof app.view.application.ApplicationController
     * @description Log out of the application
     * @emits LOGGED_OUT
     */
    logout: function () {
      this.account.logout();
      this.navigation.reset();
      this.eventService.$emit(this.eventService.events.LOGGED_OUT);
    }
  });

})();
