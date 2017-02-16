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
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function MetricsSummaryController($state, $stateParams, modelManager, utilsService) {
    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.application');

    var metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    var controlPlaneModel = modelManager.retrieve('control-plane.model');
    this.guid = $stateParams.guid;
    this.nodes = [];
    this.kubernetesNodes = [];

    this.showCardLayout = true;

    function init() {
      return controlPlaneModel.getComputeNodes(that.guid)
        .then(function (nodes) {
          that.nodes = nodes;

          that.kubernetesNodes = _.filter(nodes, function (node) {
            return node.spec.profile !== 'gluster';
          });
        });
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.summary', $state, init);

  }

  angular.extend(MetricsSummaryController.prototype, {});

})();
