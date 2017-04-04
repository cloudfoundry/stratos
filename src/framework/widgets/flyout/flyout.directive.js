(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
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
   * <flyout flyout-active="showFlyout" flyout-close-icon="'my-close-icon'">
   *   <ng-include src="'my.template.html'"></ng-include>
   * </flyout>
   */
  function flyout() {
    return {
      link: link,
      restrict: 'E',
      scope: {
        flyoutActive: '=',
        flyoutCloseIcon: '=?'
      },
      templateUrl: 'framework/widgets/flyout/flyout.html',
      transclude: true,
      controller: FlyoutController
    };

    function link(scope) {
      scope.flyoutCloseIcon = scope.flyoutCloseIcon || 'glyphicon glyphicon-remove';

      scope.close = function () {
        scope.flyoutActive = false;
      };
    }
  }

  FlyoutController.$inject = [
    '$scope',
    'frameworkUtilsDialogEvents'
  ];

  /**
   * @name FlyoutController
   * @description Controller for a flyout to support Dialog Events
   * @param {object} $scope - angualr $scope
   * @param {object} frameworkUtilsDialogEvents - Dialog Events service
   */
  function FlyoutController($scope, frameworkUtilsDialogEvents) {
    $scope.$watch('flyoutActive', function (nv, ov) {
      if (!ov && nv === true) {
        frameworkUtilsDialogEvents.notifyOpened();
      } else if (ov === true && nv === false) {
        frameworkUtilsDialogEvents.notifyClosed();
      }
    });
  }

})();
