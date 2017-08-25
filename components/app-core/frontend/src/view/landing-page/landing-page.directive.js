(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('landingPage', landingPage);

  /**
   * @namespace app.view.landingPage
   * @memberof app.view
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
      templateUrl: 'app/view/landing-page/landing-page.html',
      transclude: true,
      controller: landingPageController,
      controllerAs: 'landingPageCtrl'
    };
  }

  function landingPageController($scope, languageService) {
    var vm = this;
    vm.languageService = languageService;
    vm.languageOptions = [];
    languageService.initialised.then(function () {
      vm.languageOptions = languageService.getAll();
      vm.currentLanguage = languageService.getLocale();

      $scope.$watch(function () {
        return vm.currentLanguage;
      }, function (newValue, oldValue) {
        if (newValue !== oldValue) {
          languageService.setLocale(newValue);
        }
      });
    });

  }
})();
