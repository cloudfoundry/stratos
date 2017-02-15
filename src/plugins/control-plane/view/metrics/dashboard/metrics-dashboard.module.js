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

  MetricsDashBoardController.$inject = [
    '$q',
    '$scope',
    '$state',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function MetricsDashBoardController($q, $scope, $state, modelManager, utilsService) {

    var that = this;
    var metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');

    function init() {
      return metricsModel.getNodes().then(function (nodes) {
        nodes = nodes.sort();
        that.nodesList = nodes;
      });
    }

    utilsService.chainStateResolve('cp.metrics.dashboard', $state, init);

  }

})
();
