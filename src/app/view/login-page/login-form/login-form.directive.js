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
    'app.event.eventService'
  ];

  /**
   * @namespace app.view.loginForm.LoginFormController
   * @memberof app.view.loginForm
   * @name LoginFormController
   * @constructor
   * @param {app.event.eventService} eventService - the event bus service
   * @property {boolean} showPassword - show or hide password in plain text
   */
  function LoginFormController(eventService) {
    this.eventService = eventService;
    this.showPassword = false;
    this.eventService.$on(this.eventService.events.LOGIN_FAILED, this.clearPassword.bind(this));
  }

  angular.extend(LoginFormController.prototype, {
    /**
     * @function showHidePassword
     * @memberof app.view.loginForm.LoginFormController
     * @description Toggle show or hide password in plain text
     * @returns {void}
     */
    showHidePassword: function () {
      this.showPassword = !this.showPassword;
    },

    /**
     * @function clearPassword
     * @memberof app.view.loginForm.LoginFormController
     * @description Clear the contents of the password field
     */
    clearPassword: function () {
      this.password = '';
    }
  });

})();
