(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('navbar', navbar);

  navbar.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.navbar
   * @memberof app.view
   * @name navbar
   * @description A navbar directive
   * @param {string} path - the application base path
   * @returns {object} The navbar directive definition object
   */
  function navbar(path) {
    return {
      templateUrl: path + 'view/navbar/navbar.html',
      controller: NavBarController,
      controllerAs: 'navBarCtrl'
    };
  }

  NavBarController.$inject = [
    '$stateParams'
  ];

  /**
   * @namespace app.view.navbar
   * @memberof app.view
   * @name NavBarController
   * @description Controller for the navbar - navigation menu items can be hidden based on ui routerstate params
   * @constructor
   * @param  {$stateParams} $stateParams - UI Router state params
   */
  function NavBarController($stateParams) {
    this.hideNavigation = $stateParams.hideNavigation;
  }

})();
