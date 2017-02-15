(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard', [
      'control-plane.view.metrics.dashboard.summary',
      'control-plane.view.metrics.dashboard.cpu-summary',
      'control-plane.view.metrics.dashboard.memory-summary',
      'control-plane.view.metrics.dashboard.data-traffic-summary'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard', {
      url: '',
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/metrics-dashboard.html',
      controller: MetricsDashBoardController,
      controllerAs: 'metricsDashboardCtrl'
    });
  }

  MetricsDashBoardController.$inject = [];

  function MetricsDashBoardController() {
  }
})();
