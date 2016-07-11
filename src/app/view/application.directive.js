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
    this.showClusterRegistration = false;

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
     */
    onLoggedIn: function () {
      var that = this;
      this.loggedIn = true;
      this.failedLogin = false;
      this.serverErrorOnLogin = false;
      this.serverFailedToRespond = false;
      this.showGlobalSpinner = true;

      // If we have a setup error, then we don't want ot continue loging to some other page
      // We will reditect to our error page
      this.continueLogin = true;

      /**
       * Show cluster registration if user is ITOps (hdp3.admin).
       * Otherwise, show service instance registration as a
       * developer if unregistered.
       */
      var account = this.modelManager.retrieve('app.model.account');

      // Fetch the list of services instances
      /* eslint-disable */
      // TODO: If this fails, we should show a notification message
      /* eslint-enable */
      this.modelManager.retrieve('app.model.serviceInstance')
        .list()
        .then(function onSuccess(data) {
          var noHCFInstances = data.numAvailable === 0;
          // Admin
          if (account.isAdmin()) {
            // Show registration if we don't have any HCF instances
            that.showClusterRegistration = noHCFInstances;
          } else {
            // Developer
            if (noHCFInstances) {
              // No HCF instances, so the system is not setup and the user can't fix this
              that.continueLogin = false;
              that.eventService.$emit(that.eventService.events.TRANSFER, 'error-page', {error: 'notSetup'});
            } else {
              var userServiceInstanceModel = that.modelManager.retrieve('app.model.serviceInstance.user');
              // Need to get the user's service list to determine if they have any connected
              return userServiceInstanceModel.list().then(function () {
                // Developer - allow user to connect services, if we have some and none are connected
                that.showRegistration = userServiceInstanceModel.numValid === 0;
              });
            }
          }
        })
        .finally(function () {
          that.showGlobalSpinner = false;
          if (that.continueLogin) {
            that.eventService.$emit(that.eventService.events.LOGIN);
          }
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
     */
    onLoggedOut: function () {
      this.eventService.$emit(this.eventService.events.LOGOUT);
      this.loggedIn = false;
      this.showRegistration = false;
    }
  });

})();
