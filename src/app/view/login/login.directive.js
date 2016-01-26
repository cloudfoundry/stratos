(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('login', login);

  login.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.login
   * @memberof app.view
   * @name login
   * @description A login page directive
   * @property {string} templateUrl - the login page template filepath
   */
  function login(path) {
    return {
      templateUrl: path + 'view/login/login.html'
    };
  }

})();
