(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('loginForm', loginForm);

  loginForm.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.loginForm
   * @memberof app.view
   * @name loginForm
   * @description A login-form directive
   * @param {string} path - the application base path
   * @returns {object} The login form directive definition object
   */
  function loginForm(path) {
    return {
      controller: LoginFormController,
      controllerAs: 'loginFormCtrl',
      templateUrl: path + 'view/login-page/login-form/login-form.html'
    };
  }

  LoginFormController.$inject = [
    '$timeout',
    'app.event.eventService'
  ];

  /**
   * @namespace app.view.loginForm.LoginFormController
   * @memberof app.view.loginForm
   * @name LoginFormController
   * @constructor
   * @param {object} $timeout - the Angular $timeout service
   * @param {app.event.eventService} eventService - the event bus service
   * @property {object} $timeout - the Angular $timeout service
   * @property {app.event.eventService} eventService - the event bus service
   * @property {boolean} loggingIn - flag indicating app is still authenticating
   * @property {object} loginTimeout - the promise returned by $timeout for loggingIn
   */
  function LoginFormController($timeout, eventService) {
    var that = this;
    this.$timeout = $timeout;
    this.eventService = eventService;
    this.loggingIn = false;
    this.loginTimeout = null;

    this.eventService.$on(this.eventService.events.LOGGED_IN, function () {
      that.loggingIn = false;
    });
    this.eventService.$on(this.eventService.events.LOGIN_FAILED, function () {
      that.clearPassword();
    });
    this.eventService.$on(this.eventService.events.HTTP_5XX_ON_LOGIN, function () {
      that.clearPassword();
    });
    this.eventService.$on(this.eventService.events['HTTP_-1'], function () {
      that.clearPassword();
    });
  }

  angular.extend(LoginFormController.prototype, {
    /**
     * @function clearPassword
     * @memberof app.view.loginForm.LoginFormController
     * @description Clear the contents of the password field
     */
    clearPassword: function () {
      this.password = '';

      this.$timeout.cancel(this.loginTimeout);
      this.loggingIn = false;
    },

    /**
     * @function login
     * @memberof app.view.loginForm.LoginFormController
     * @description Show spinner while still authenticating
     * and continue to submit form
     * @returns {boolean} - always true
     */
    login: function () {
      var that = this;

      // use timeout to prevent flashing of spinner with fast logins
      this.loginTimeout = this.$timeout(function () {
        that.loggingIn = true;
      }, 500);

      return true;
    }
  });

})();
