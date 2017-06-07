(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('percentGauge', percentGauge);

  /**
   * @namespace app.framework.widgets.percentGauge
   * @memberof app.framework.widgets
   * @name percentGauge
   * @description A small widget displaying a percentage as a progress bar.
   * @returns {object} The percent-gauge directive definition object
   */
  function percentGauge() {
    return {
      restrict: 'E',
      bindToController: {
        title: '@',
        value: '@',
        valueText: '@?',
        barOnly: '=',
        mode: '@'
      },
      controller: PercentGaugeController,
      controllerAs: 'pgCtrl',
      templateUrl: 'framework/widgets/percent-gauge/percent-gauge.html',
      scope: {}
    };
  }

  /**
   * @namespace app.framework.widgets.PercentGaugeController
   * @memberof app.framework.widgets
   * @name PercentGaugeController
   * @constructor
   * @property {string} title - the title of this gauge
   * @property {string} value - a value for this gauge between 0 and 1
   * @property {string} valueText - a string to display as the value
   */
  function PercentGaugeController() {
    if (!this.mode) {
      this.mode = 'quota';
    }
  }

})();
