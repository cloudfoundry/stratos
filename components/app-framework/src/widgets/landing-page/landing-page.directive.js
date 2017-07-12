(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('landingPage', landingPage);

  /**
   * @namespace app.framework.widgets.landingPage
   * @memberof app.framework.widgets
   * @name landingPage
   * @description ????
   * @example
   * <landing-page>
   * This is the internal content
   * </landing-page>
   * @returns {object} ????
   */
  function landingPage() {
    return {
      bindToController: {
        theme: '@',
        hideCopy: '='
      },
      controller: LandingPageController,
      controllerAs: 'landingPageCtrl',
      scope: {},
      templateUrl: 'framework/widgets/landing-page/landing-page.html',
      transclude: true
    };
  }

  /**
   * @namespace app.framework.widgets.landingPage
   * @memberof app.framework.widgets
   * @name LandingPageController
   * @constructor
   * @param {object} $document - Angular $document service
   * @param {object} $timeout - Angular $timeout service
   */
  function LandingPageController($document, $timeout) {

    var vm = this;

  }
})();
