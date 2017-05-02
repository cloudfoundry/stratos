(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('pageFooter', pageFooter);

  /**
   * @namespace app.view.pageFooter
   * @memberof app.view
   * @name pageFooter
   * @description A page footer directive
   * @param {string} appBasePath - the application base path
   * @returns {object} The pageFooter directive definition object
   */
  function pageFooter(appBasePath) {
    return {
      templateUrl: appBasePath + 'view/page-footer/page-footer.html',
      controller: PageFooterController,
      controllerAs: 'pageFooterCtrl',
      bindToController: {
        context: '@'
      }
    };
  }

  function PageFooterController() {}

})();
