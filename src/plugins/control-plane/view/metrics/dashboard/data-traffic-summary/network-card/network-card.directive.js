(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('networkCard', networkCard);

  networkCard.$inject = ['app.basePath'];

  function networkCard() {
    return {
      bindToController: {
        node: '@',
        metricsNodeName: '@',
        title: '@'
      },
      controller: NetworkCardController,
      controllerAs: 'networkCardCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/data-traffic-summary/network-card/network-card.html'
    };
  }

  NetworkCardController.$inject = [
    '$interval',
    '$state',
    '$scope',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function NetworkCardController($interval, $state, $scope, $q, modelManager, utilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.$state = $state;
    this.$q = $q;
    this.utilsService = utilsService;
    this.metricsData = {};
    this.cpuLimit = 0;

    this.cardData = {
      title: this.title
    };
    function init() {
      if (that.showUtilizationDonut) {
        return that.fetchLimitMetrics();
      } else {
        return $q.resolve;
      }
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.summary', $state, init);
  }

  angular.extend(NetworkCardController.prototype, {

    getCardData: function () {
      return this.cardData;
    },

    getNodeFilter: function () {
      return this.metricsModel.makeNodeNameFilter(this.metricsNodeName);
    },

    hasMetrics: function (metricName) {
      return _.has(this.metricsData, metricName) && _.first(this.metricsData[metricName]).dataPoints.length > 0;
    },

    fetchLimitMetrics: function () {
      var that = this;
      this.metricsModel.getNodeCpuLimit(this.metricsNodeName).then(function (cpuLimit) {
        that.cpuLimit = cpuLimit;
      });
    },

    getNodeName: function () {

      if (this.node === '*') {
        return 'all';
      } else {
        return this.node;
      }
    },

    yTickFormatter: function (d){
     return d;
    },

    namespaceDetails: function () {
      this.$state.go('metrics.dashboard.namespace.details', {node: this.node});
    }
  });

})();
