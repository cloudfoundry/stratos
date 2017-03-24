(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('percentGauge', percentGauge);

  percentGauge.$inject = [
    'helion.framework.basePath'
  ];

  /**
   * @namespace helion.framework.widgets.percentGauge
   * @memberof helion.framework.widgets
   * @name percentGauge
   * @description A small widget displaying a percentage as a progress bar.
   * @param {string} path - host path
   * @returns {object} The percent-gauge directive definition object
   */
  function percentGauge(path) {
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
      templateUrl: path + 'widgets/percent-gauge/percent-gauge.html',
      scope: {}
    };
  }

  PercentGaugeController.$inject = [];

  /**
   * @namespace helion.framework.widgets.PercentGaugeController
   * @memberof helion.framework.widgets
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
