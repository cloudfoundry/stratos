(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('loginForm', loginForm);

  loginForm.$inject = [
    'appBasePath'
  ];

  /**
   * @namespace app.view.loginForm
   * @memberof app.view
   * @name loginForm
   * @description A login-form directive
   * @param {string} appBasePath - the application base path
   * @returns {object} The login form directive definition object
   */
  function loginForm(appBasePath) {
    return {
      controller: LoginFormController,
      controllerAs: 'loginFormCtrl',
      templateUrl: appBasePath + 'view/login-page/login-form/login-form.html'
    };
  }

  LoginFormController.$inject = [
    '$scope',
    '$timeout',
    'appEventEventService'
  ];

  /**
   * @namespace app.view.loginForm.LoginFormController
   * @memberof app.view.loginForm
   * @name LoginFormController
   * @constructor
   * @param {object} $scope - the Angular $scope service
   * @param {object} $timeout - the Angular $timeout service
   * @param {app.event.appEventEventService} appEventEventService - the event bus service
   * @property {object} $timeout - the Angular $timeout service
   * @property {app.event.appEventEventService} appEventEventService - the event bus service
   * @property {boolean} loggingIn - flag indicating app is still authenticating
   * @property {object} loginTimeout - the promise returned by $timeout for loggingIn
   */
  function LoginFormController($scope, $timeout, appEventEventService) {
    var that = this;
    this.$timeout = $timeout;
    this.appEventEventService = appEventEventService;
    this.loggingIn = false;
    this.loginTimeout = null;

    var logInListener = this.appEventEventService.$on(this.appEventEventService.events.LOGGED_IN, function () {
      that.loggingIn = false;
    });
    var logOutListener = this.appEventEventService.$on(this.appEventEventService.events.LOGIN_FAILED, function () {
      that.clearPassword();
    });
    var logTimeoutListener = this.appEventEventService.$on(this.appEventEventService.events.LOGIN_TIMEOUT, function () {
      that.clearPassword();
    });
    var http500Listener = this.appEventEventService.$on(this.appEventEventService.events.HTTP_5XX_ON_LOGIN, function () {
      that.clearPassword();
    });
    var httpFailureListener = this.appEventEventService.$on(this.appEventEventService.events['HTTP_-1'], function () {
      that.clearPassword();
    });

    $scope.$on('$destroy', function () {
      logInListener();
      logOutListener();
      logTimeoutListener();
      http500Listener();
      httpFailureListener();
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
