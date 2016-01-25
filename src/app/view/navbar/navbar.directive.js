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
   * @property {string} templateUrl - the navbar template filepath
   */
  function navbar(path) {
    return {
      templateUrl: path + '/view/navbar/navbar.html'
    };
  }

})();
