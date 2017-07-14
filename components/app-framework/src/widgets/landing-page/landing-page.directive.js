(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('landingPage', landingPage);

  /**
   * @namespace app.framework.widgets.landingPage
   * @memberof app.framework.widgets
   * @name landingPage
   * @description Container template to provide consistent screen layout to landing pages
   * @example
   * <landing-page>
   *  <div>This is the internal, custom content</div>
   * </landing-page>
   * @returns {object} Directive config
   */
  function landingPage() {
    return {
      templateUrl: 'framework/widgets/landing-page/landing-page.html',
      transclude: true,
      controller: landingPageController,
      controllerAs: 'landingPageCtrl'
    };
  }

  function landingPageController(appSelectLanguage) {
    var vm = this;

    vm.showLanguageSelection = showLanguageSelection;

    /**
     * @function showLanguageSelection
     * @memberof app.framework.widgets.landingPage
     * @description Shows the Language Selection dialog
     * @public
     */
    function showLanguageSelection() {
      appSelectLanguage.show();
    }
  }
})();
