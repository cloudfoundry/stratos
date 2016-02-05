(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('footer', footer);

  footer.$inject = [
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
  function footer(path) {
    return {
      templateUrl: path + 'view/footer/footer.html'
    };
  }

})();
