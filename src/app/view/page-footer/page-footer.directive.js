(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('pageFooter', pageFooter);

  pageFooter.$inject = [
    'appBasePath'
  ];

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
      scope: {
        mode: '@'
      },
      bindToController: true
    };
  }

  PageFooterController.$inject = [
    '$scope',
    'appUtilsService'
  ];

  function PageFooterController($scope, utilsService) {
    this.OEM_CONFIG = utilsService.getOemConfiguration();
  }

})();
