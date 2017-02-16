(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.data-traffic-summary', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.data-traffic-summary', {
      url: '/data-traffic',
      params: {
        guid: ''
      },
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/data-traffic-summary/data-traffic-summary.html',
      controller: DataTrafficSummaryController,
      controllerAs: 'dataTrafficSummaryCtrl'
    });
  }


  DataTrafficSummaryController.$inject = [
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function DataTrafficSummaryController($state, $stateParams, modelManager, utilsService) {
    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.application');

    var metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    var controlPlaneModel = modelManager.retrieve('control-plane.model');
    this.utilsService = utilsService;
    this.guid = $stateParams.guid;
    this.nodes = [];
    this.kubernetesNodes = [];

    this.totalNetworkUsage = gettext('Total Network Traffic');

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

  angular.extend(DataTrafficSummaryController.prototype, {



  });

})();
