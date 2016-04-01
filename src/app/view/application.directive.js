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
    '$timeout',
    'app.event.eventService',
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.application.ApplicationController
   * @memberof app.view.application
   * @name ApplicationController
   * @param {function} $timeout - angular $timeout service
   * @param {app.event.eventService} eventService - the event bus service
   * @param {app.model.modelManager} modelManager - the application model manager
   * @property {app.event.eventService} eventService - the event bus service
   * @property {app.model.modelManager} modelManager - the application model manager
   * @property {boolean} loggedIn - a flag indicating if user logged in
   * @property {boolean} failedLogin - a flag indicating if user login failed due to bad credentials.
   * @property {boolean} serverErrorOnLogin - a flag indicating if user login failed because of a server error.
   * @property {boolean} showRegistration - a flag indicating if the registration page should be shown
   * @class
   */
  function ApplicationController($timeout, eventService, modelManager) {
    var that = this;

    this.eventService = eventService;
    this.modelManager = modelManager;
    this.loggedIn = false;
    this.failedLogin = false;
    this.serverErrorOnLogin = false;
    this.serverFailedToRespond = false;
    this.showGlobalSpinner = false;
    this.showRegistration = false;
    $timeout(function () {
      that.verifySession();
    }, 0);
  }

  angular.extend(ApplicationController.prototype, {
    /**
     * @function verifySession
     * @memberof app.view.application.ApplicationController
     * @description verify session
     * @public
     * @returns {void}
     */
    verifySession: function () {
      var that = this;
      this.modelManager.retrieve('app.model.account')
        .verifySession()
        .then(function () {
          that.onLoggedIn();
        });
    },

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
          function (response) {
            that.onLoginFailed(response);
          }
        );
    },

    /**
     * @function onLoggedIn
     * @memberof app.view.application.ApplicationController
     * @description Logged-in event handler
     * @emits LOGIN
     * @private
     * @returns {void}
     */
    onLoggedIn: function () {
      var that = this;
      this.eventService.$emit(this.eventService.events.LOGIN);
      this.loggedIn = true;
      this.failedLogin = false;
      this.serverErrorOnLogin = false;
      this.serverFailedToRespond = false;
      this.showGlobalSpinner = true;

      this.modelManager.retrieve('app.model.serviceInstance.user')
        .list()
        .then(function onSuccess(data) {
          that.showRegistration = data.numCompleted === 0;
          that.showGlobalSpinner = false;
        });
    },

    /**
     * @function onLoginFailed
     * @memberof app.view.application.ApplicationController
     * @description Login-failure event handler
     * @param {object} response - the HTTP response
     * @emits LOGIN_FAILED
     * @emits HTTP_5XX_ON_LOGIN
     * @private
     * @returns {void}
     */
    onLoginFailed: function (response) {
      if (response.status === -1) {
        // handle the case when the server never responds
        this.serverFailedToRespond = true;
        this.serverErrorOnLogin = false;
        this.failedLogin = false;
      } else if (response.status >= 500 && response.status < 600) {
        // handle 5xx errors when attempting to login
        this.eventService.$emit(this.eventService.events.HTTP_5XX_ON_LOGIN);
        this.serverFailedToRespond = false;
        this.serverErrorOnLogin = true;
        this.failedLogin = false;
      } else {
        // general authentication failed
        this.eventService.$emit(this.eventService.events.LOGIN_FAILED);
        this.serverFailedToRespond = false;
        this.serverErrorOnLogin = false;
        this.failedLogin = true;
      }
      this.loggedIn = false;
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
     * @emits LOGOUT
     * @private
     * @returns {void}
     */
    onLoggedOut: function () {
      this.eventService.$emit(this.eventService.events.LOGOUT);
      this.loggedIn = false;
      this.showRegistration = false;
    }
  });

})();
