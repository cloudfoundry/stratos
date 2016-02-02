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

  function LoginFormController() {}

})();
