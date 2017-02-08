(function () {
  'use strict';

  angular
    .module('app.view.metrics.dashboard', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('metrics.dashboard', {
      url: '',
      templateUrl: 'app/view/metrics/dashboard/metrics-dashboard.html',
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
        that.nodesList = nodes;
      });
    }

    utilsService.chainStateResolve('metrics.dashboard', $state, init);

  }

})
();
