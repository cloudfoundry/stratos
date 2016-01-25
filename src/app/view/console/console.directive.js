(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('console', console);

  console.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.console
   * @memberof app.view
   * @name console
   * @description A console directive
   * @property {string} templateUrl - the console template filepath
   */
  function console(path) {
    return {
      templateUrl: path + 'view/console/console.html'
    };
  }

})();
