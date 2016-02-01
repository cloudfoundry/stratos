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
   * @param {string} path - the application base path
   * @returns {object} The login page directive definition object
   */
  function loginPage(path) {
    return {
      templateUrl: path + 'view/login-page/login-page.html'
    };
  }

})();
