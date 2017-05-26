(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
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

  function AppIconController() {
    this.svgIcon = this.icon.indexOf('svg:') === 0;
    if (this.svgIcon) {
      this.svg = 'svg/' + this.icon.substr(4);
    }
  }

})();
