(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('loginPage', loginPage);

  loginPage.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.loginPage
   * @memberof app.view
   * @name loginPage
   * @description A login page directive
   * @property {string} templateUrl - the login page template filepath
   */
  function loginPage(path) {
    return {
      templateUrl: path + 'view/login-page/login-page.html'
    };
  }

})();
