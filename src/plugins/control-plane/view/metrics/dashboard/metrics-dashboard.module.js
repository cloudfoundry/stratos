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
      params: {
        guid: ''
      },
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/metrics-dashboard.html',
      controller: MetricsDashBoardController,
      controllerAs: 'metricsDashboardCtrl'
    });
  }

  MetricsDashBoardController.$inject = [
    '$state',
    '$stateParams',
    'control-plane.metrics.metrics-data-service',
    'app.utils.utilsService',
    'app.model.modelManager'
  ];

  function MetricsDashBoardController($state, $stateParams, metricsDataService, utilsService, modelManager) {
    var that = this;
    var guid = $stateParams.guid;
    this.stackatoInfo = modelManager.retrieve('app.model.stackatoInfo');
    this.guid = guid;

    function init() {
      return metricsDataService.fetchComputeNodes(guid).finally(function () {
        return that.stackatoInfo.getStackatoInfo().then(function (info) {
          that.endpoint = info.endpoints.hcp[that.guid];
        });
      });
    }

    utilsService.chainStateResolve('cp.metrics.dashboard', $state, init);
  }
})();
