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

  LoginFormController.$inject = [];

  /**
   * @namespace app.view.loginForm.LoginFormController
   * @memberof app.view.loginForm
   * @name LoginFormController
   * @constructor
   * @property {boolean} showPassword - show or hide password in plain text
   */
  function LoginFormController() {
    this.showPassword = false;
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
    }
  });

})();
