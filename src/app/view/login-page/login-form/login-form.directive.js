(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('loginForm', loginForm);

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

  /**
   * @namespace app.view.loginForm.LoginFormController
   * @memberof app.view.loginForm
   * @name LoginFormController
   * @constructor
   * @param {object} $scope - the Angular $scope service
   * @param {object} $timeout - the Angular $timeout service
   * @param {app.appUtilsService.appEventService} appEventService - the event bus service
   * @property {object} $timeout - the Angular $timeout service
   * @property {app.utils.appEventService} appEventService - the event bus service
   * @property {boolean} loggingIn - flag indicating app is still authenticating
   * @property {object} loginTimeout - the promise returned by $timeout for loggingIn
   */
  function LoginFormController($scope, $timeout, appEventService) {
    var vm = this;

    vm.loggingIn = false;
    vm.login = login;
    vm.clearPassword = clearPassword;
    vm.$timeout = $timeout;
    vm.appEventService = appEventService;
    vm.username = '';
    vm.password = '';

    var loginTimeout = null;

    var logInListener = appEventService.$on(appEventService.events.LOGGED_IN, function () {
      vm.loggingIn = false;
    });
    var logOutListener = appEventService.$on(appEventService.events.LOGIN_FAILED, function () {
      vm.clearPassword();
    });
    var logTimeoutListener = appEventService.$on(appEventService.events.LOGIN_TIMEOUT, function () {
      vm.clearPassword();
    });
    var http500Listener = appEventService.$on(appEventService.events.HTTP_5XX_ON_LOGIN, function () {
      vm.clearPassword();
    });
    var httpFailureListener = appEventService.$on(appEventService.events['HTTP_-1'], function () {
      vm.clearPassword();
    });

    $scope.$on('$destroy', function () {
      logInListener();
      logOutListener();
      logTimeoutListener();
      http500Listener();
      httpFailureListener();
    });

    /**
     * @function clearPassword
     * @memberof app.view.loginForm.LoginFormController
     * @description Clear the contents of the password field
     */
    function clearPassword() {
      vm.password = '';

      $timeout.cancel(loginTimeout);
      vm.loggingIn = false;
    }

    /**
     * @function login
     * @memberof app.view.loginForm.LoginFormController
     * @description Show spinner while still authenticating
     * and continue to submit form
     * @returns {boolean} - always true
     */
    function login() {
      // use timeout to prevent flashing of spinner with fast logins
      loginTimeout = $timeout(function () {
        vm.loggingIn = true;
      }, 500);

      return true;
    }
  }

})();
