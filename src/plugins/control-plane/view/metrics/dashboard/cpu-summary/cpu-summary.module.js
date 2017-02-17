(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.cpu-summary', [
      'control-plane.view.metrics.dashboard.cpu-summary.cards',
      'control-plane.view.metrics.dashboard.cpu-summary.list'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.cpu-summary', {
      url: '/cpu',
      params: {
        newlyCreated: false
      },
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/cpu-summary/cpu-summary.html',
      controller: CpuSummaryController,
      controllerAs: 'cpuSummaryCtrl'
    });
  }

  CpuSummaryController.$inject = [
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function CpuSummaryController($state, $stateParams, modelManager, utilsService) {
    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.application');

    var metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    var controlPlaneModel = modelManager.retrieve('control-plane.model');
    this.guid = $stateParams.guid;
    this.nodes = [];
    this.kubernetesNodes = [];

    this.totalCpuUsageTile = gettext('Total CPU Usage');

    function init() {
      return controlPlaneModel.getComputeNodes(that.guid)
        .then(function (nodes) {
          that.nodes = nodes;

          that.kubernetesNodes = _.filter(nodes, function (node) {
            return node.spec.profile !== 'gluster';
          });

          // hack for dev-harness
          _.each(that.kubernetesNodes, function (node) {
            if (node.spec.hostname === '192.168.200.2') {
              node.spec.hostname = 'kubernetes-master';
            }
            if (node.spec.hostname === '192.168.200.3') {
              node.spec.hostname = 'kubernetes-node';
            }
          });
        });

    }

    utilsService.chainStateResolve('cp.metrics.dashboard.summary', $state, init);

  }

  angular.extend(CpuSummaryController.prototype, {});

})();
