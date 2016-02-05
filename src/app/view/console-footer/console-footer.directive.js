(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('consoleFooter', consoleFooter);

  consoleFooter.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.footer
   * @memberof app.view
   * @name footer
   * @description A footer directive
   * @param {string} path - the application base path
   * @returns {object} The footer directive definition object
   */
  function consoleFooter(path) {
    return {
      templateUrl: path + 'view/console-footer/console-footer.html'
    };
  }

})();
