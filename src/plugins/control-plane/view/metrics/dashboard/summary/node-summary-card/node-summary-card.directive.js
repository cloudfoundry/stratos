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
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function NodeCardController(modelManager, utilsService, metricsDataService) {

    this.metricsModel = modelManager.retrieve('control-plane.model.metrics');
    this.utilsService = utilsService;
    this.metricsData = {};
    this.cpuLimit = 0;
    this.memoryLimit = 0;

    this.nodeName = this.node.spec.hostname;
    this.metricsNodeName = this.node.spec.metricsNodeName;

    this.availabilityZone = this.node.spec.zone || 'Dev Harness';

    this.cardData = {
      title: this.nodeName,
      type: metricsDataService.getNodeTypeForNode(this.node)
    };

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
