(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('statusIndicator', statusIndicator);

  /**
   * @namespace app.framework.widgets.statusIndicator
   * @memberof app.framework.widgets
   * @name statusIndicator
   * @description A status indicator directive
   * @returns {object} The status indicator directive definition object
   * @example
   *
   */
  function statusIndicator() {
    return {
      bindToController: {
        status: '=',
        onIcon: '@',
        offIcon: '@',
        onLabel: '@',
        offLabel: '@',
        onClass: '@',
        offClass: '@'
      },
      controller: StatusIndicatorController,
      controllerAs: 'statusCtrl',
      templateUrl: 'framework/widgets/status-indicator/status-indicator.html',
      scope: {}
    };
  }

  /**
   * @namespace app.framework.widgets.statusIndicator.PaginatorController
   * @memberof app.framework.widgets
   * @name StatusIndicatorController
   * @constructor
   */
  function StatusIndicatorController() {
    var vm = this;
    vm.onIcon = vm.onIcon || 'check_box';
    vm.offIcon = vm.offIcon || 'check_box_outline_blank';
    vm.onClass = vm.onClass || 'console-status-enabled';
    vm.offClass = vm.offClass || 'console-status-disabled';
  }

})();
