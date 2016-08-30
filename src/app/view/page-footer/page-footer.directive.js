(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('pageFooter', pageFooter);

  pageFooter.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.pageFooter
   * @memberof app.view
   * @name pageFooter
   * @description A page footer directive
   * @param {string} path - the application base path
   * @returns {object} The pageFooter directive definition object
   */
  function pageFooter(path) {
    return {
      templateUrl: path + 'view/page-footer/page-footer.html'
    };
  }

})();
