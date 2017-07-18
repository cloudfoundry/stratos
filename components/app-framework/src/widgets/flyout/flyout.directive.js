(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('flyout', flyout);

  /**
   * @name flyout
   * @description A flyout directive that slides in from
   * the right.
   * @returns {*}
   * @example
   * <flyout flyout-active="showFlyout">
   *   <p>This is my content</p>
   * </flyout>
   * <flyout flyout-active="showFlyout">
   *   <ng-include src="'my.template.html'"></ng-include>
   * </flyout>
   */
  function flyout() {
    return {
      restrict: 'E',
      scope: {
        flyoutActive: '='
      },
      bindToController: true,
      templateUrl: 'framework/widgets/flyout/flyout.html',
      transclude: true,
      controller: FlyoutController,
      controllerAs: 'flyoutCtrl'
    };

  }

  /**
   * @name FlyoutController
   * @description Controller for a flyout to support Dialog Events
   * @param {object} $scope - angualr $scope
   * @param {object} frameworkDialogEvents - Dialog Events service
   */
  function FlyoutController($scope, frameworkDialogEvents) {
    var vm = this;

    vm.close = function () {
      vm.flyoutActive = false;
    };

    $scope.$watch('flyoutActive', function (nv, ov) {
      if (!ov && nv === true) {
        frameworkDialogEvents.notifyOpened();
      } else if (ov === true && nv === false) {
        frameworkDialogEvents.notifyClosed();
      }
    });
  }

})();
