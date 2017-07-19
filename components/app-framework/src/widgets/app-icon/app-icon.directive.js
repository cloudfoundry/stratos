(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('appIcon', appIcon);

  /**
   * @name appIcon
   * @description An icon directive to show material icon or an svg icon
   * @returns {*}
   */
  function appIcon() {
    return {
      bindToController: {
        icon: '@',
        iconClass: '@'
      },
      controller: AppIconController,
      controllerAs: 'appIconCtrl',
      scope: {},
      templateUrl: 'framework/widgets/app-icon/app-icon.html'
    };
  }

  function AppIconController($scope) {
    var vm = this;

    $scope.$watch('appIconCtrl.icon', function () {
      vm.svgIcon = vm.icon.indexOf('svg:') === 0;
      if (vm.svgIcon) {
        vm.svg = 'svg/' + vm.icon.substr(4);
      }
    });

  }

})();
