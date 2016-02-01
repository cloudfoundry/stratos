(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('consoleView', consoleView);

  consoleView.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.consoleView
   * @memberof app.view
   * @name consoleView
   * @description A console view directive
   * @property {string} templateUrl - the console view template filepath
   */
  function consoleView(path) {
    return {
      templateUrl: path + 'view/console-view/console-view.html'
    };
  }

})();
