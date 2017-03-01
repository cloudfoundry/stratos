(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('nodeSummaryCard', nodeSummaryCard);

  nodeSummaryCard.$inject = ['app.basePath'];

  function nodeSummaryCard() {
    return {
      bindToController: {
        node: '='
      },
      controller: NodeCardController,
      controllerAs: 'nodeSummaryCardCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/summary/node-summary-card/node-summary-card.html'
    };
  }

  NodeCardController.$inject = [
    '$interval',
    '$state',
    '$scope',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function NodeCardController($interval, $state, $scope, $q, modelManager, utilsService, metricsDataService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.$state = $state;
    this.$q = $q;
    this.utilsService = utilsService;
    this.metricsData = {};
    this.cpuLimit = 0;
    this.memoryLimit = 0;
    this.showDetail = false;

    this.nodeName = this.node.spec.hostname;
    this.metricsNodeName = this.node.spec.metricsNodeName;

    this.availabilityZone = this.node.spec.zone || 'Dev Harness';

    // var interval = $interval(function () {
    //   that.updateCpuUtilization();
    //   that.updateMemoryUtilization();
    //   that.updateNetworkDataTransmittedRate();
    //   that.updateNetworkDataReceivedRate();
    //   that.updateNodeUptime();
    // }, 120000);

    this.cardData = {
      title: this.nodeName,
      type: metricsDataService.getNodeTypeForNode(this.node)
    };

    // $scope.$on('$destroy', function () {
    //   $interval.cancel(interval);
    // });
  }

  angular.extend(NodeCardController.prototype, {

    getCardData: function () {
      return this.cardData;
    },

    getNodeFilter: function () {
      return this.metricsModel.makeNodeNameFilter(this.metricsNodeName);
    }

  });

})();
