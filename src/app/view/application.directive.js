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
   * @param {string} path - the application base path
   * @property {app.view.application.ApplicationController} controller - the application controller
   * @property {string} controllerAs - the application controller identifier
   * @property {string} templateUrl - the application template filepath
   * @returns {object} The application directive definition object
   */
  function application(path) {
    return {
      controller: ApplicationController,
      controllerAs: 'applicationCtrl',
      templateUrl: path + 'view/application.html'
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
   * @property {app.model.modelManager} modelManager - the application model manager
   * @property {boolean} loggedIn - a flag indicating if user logged in
   * @class
   */
  function ApplicationController(eventService, modelManager) {
    this.eventService = eventService;
    this.modelManager = modelManager;
    this.loggedIn = false;
    this.failedLogin = false;
  }

  angular.extend(ApplicationController.prototype, {
    /**
     * @function login
     * @memberof app.view.application.ApplicationController
     * @description Log in to the application
     * @param {string} username - the username
     * @param {string} password - the password
     * @public
     * @returns {void}
     */
    login: function (username, password) {
      var that = this;
      this.modelManager.retrieve('app.model.account')
        .login(username, password)
        .then(
          function () {
            that.onLoggedIn();
          },
          function () {
            that.onLoginFailed();
          }
        );
    },

    /**
     * @function onLoggedIn
     * @memberof app.view.application.ApplicationController
     * @description Logged-in event handler
     * @emits LOGGED_IN
     * @private
     * @returns {void}
     */
    onLoggedIn: function () {
      this.eventService.$emit(this.eventService.events.LOGGED_IN);
      this.loggedIn = true;
      this.failedLogin = false;
    },

    /**
     * @function onLoginFailed
     * @memberof app.view.application.ApplicationController
     * @description Login-failure event handler
     * @private
     * @returns {void}
     */
    onLoginFailed: function () {
      this.loggedIn = false;
      this.failedLogin = true;
    },

    /**
     * @function logout
     * @memberof app.view.application.ApplicationController
     * @description Log out of the application
     * @public
     * @returns {void}
     */
    logout: function () {
      var that = this;
      this.modelManager.retrieve('app.model.account')
        .logout()
        .then(function () {
          that.onLoggedOut();
        });
    },

    /**
     * @function onLoggedOut
     * @memberof app.view.application.ApplicationController
     * @description Logged-out event handler
     * @emits LOGGED_OUT
     * @private
     * @returns {void}
     */
    onLoggedOut: function () {
      this.eventService.$emit(this.eventService.events.LOGGED_OUT);
      this.loggedIn = false;
    }
  });

})();
