(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('navbar', navbar);

  /**
   * @namespace app.view.navbar
   * @memberof app.view
   * @name navbar
   * @description A navbar directive
   * @param {string} appBasePath - the application base path
   * @returns {object} The navbar directive definition object
   */
  function navbar(appBasePath) {
    return {
      templateUrl: appBasePath + 'view/navbar/navbar.html'
    };
  }

})();
