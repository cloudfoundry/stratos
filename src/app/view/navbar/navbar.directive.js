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
      templateUrl: path + 'view/navbar/navbar.html'
    };
  }

})();
