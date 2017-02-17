(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.summary', [
      'control-plane.view.metrics.dashboard.summary.card',
      'control-plane.view.metrics.dashboard.summary.list'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.summary', {
      url: '/summary',
      params: {
        guid: ''
      },
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/summary/summary.html',
      controller: MetricsSummaryController,
      controllerAs: 'metricsSummaryCtrl'
    });
  }

  MetricsSummaryController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.utils.utilsService'
  ];

  function MetricsSummaryController($q, $state, $stateParams, utilsService) {
    var that = this;

    this.guid = $stateParams.guid;

    this.showCardLayout = true;

    function init() {
      return $q.resolve();
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.summary', $state, init);

  }

  angular.extend(MetricsSummaryController.prototype, {});

})();
