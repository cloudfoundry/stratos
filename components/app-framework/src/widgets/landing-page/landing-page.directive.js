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

  function landingPageController($scope, $translate, languageService) {
    var vm = this;
    vm.languageService = languageService;
    vm.languageOptions = vm.languageService.getAll();
    vm.currentLanguage = $translate.use();
    $scope.$watch(function () {
      return vm.currentLanguage;
    }, function (newValue, oldValue) {
      if (newValue !== oldValue) {
        languageService.setLocale(newValue);
      }

    });
  }
})();
