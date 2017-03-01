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
    'app.utils.utilsService'
  ];

  function NodeCardController($interval, $state, $scope, $q, modelManager, utilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.$state = $state;
    this.$q = $q;
    this.utilsService = utilsService;
    this.metricsData = {};
    this.cpuLimit = 0;
    this.memoryLimit = 0;
    this.showDetail = false;
    this.dataTxRate = 0;
    this.dataRxRate = 0;

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
      title: this.nodeName
    };

    // $scope.$on('$destroy', function () {
    //   $interval.cancel(interval);
    // });

    function init() {
      // prefetch cpu-usage and memory data
      return $q.all([that.updateCpuUtilization(),
        that.updateMemoryUtilization(),
        that.updateNodeUptime(),
        that.updateNetworkDataTransmittedRate(),
        that.updateNetworkDataReceivedRate(),
        that.fetchLimitMetrics()]);
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.summary', $state, init);
  }

  angular.extend(NodeCardController.prototype, {

    getCardData: function () {
      return this.cardData;
    },

    updateCpuUtilization: function () {
      var that = this;
      return this.metricsModel.getCpuUtilization(this.metricsModel.makeNodeNameFilter(this.metricsNodeName))
        .then(function (metricsData) {
          that.metricsData[metricsData.metricName] = [metricsData];
        });
    },

    updateMemoryUtilization: function () {
      var that = this;
      return this.metricsModel.getMemoryUtilization(this.metricsModel.makeNodeNameFilter(this.metricsNodeName))
        .then(function (metricsData) {
          that.metricsData[metricsData.metricName] = [metricsData];
        });
    },

    updateNetworkDataTransmittedRate: function () {
      var that = this;
      return this.metricsModel.getNetworkTxRate(this.metricsNodeName)
        .then(function (metricsData) {
          that.metricsData.dataTxRate = metricsData;
        });
    },

    updateNetworkDataReceivedRate: function () {
      var that = this;
      return this.metricsModel.getNetworkRxRate(this.metricsNodeName)
        .then(function (metricsData) {
          that.metricsData.dataRxRate = metricsData;
        });
    },

    updateNodeUptime: function () {
      var that = this;
      this.metricsModel.getNodeUptime(this.metricsNodeName)
        .then(function (uptime) {
          that.nodeUptime = that.utilsService.getSensibleTime(uptime);
        });
    },

    fetchLimitMetrics: function () {
      var that = this;
      var promises = [this.metricsModel.getNodeCpuLimit(this.metricsNodeName),
        this.metricsModel.getNodeMemoryLimit(this.metricsNodeName)];
      this.$q.all(promises).then(function (limits) {
        that.cpuLimit = limits[0];
        // Memory limit is in bytes, convert to Mb for the filter
        that.memoryLimit = parseInt(limits[1], 10) / (1024 * 1024);
      });
    },

    getNodeFilter: function () {
      return this.metricsModel.makeNodeNameFilter(this.metricsNodeName);
    },

    hasMetrics: function (metricName) {
      return _.has(this.metricsData, metricName) && _.first(this.metricsData[metricName]).dataPoints.length > 0;
    },

    namespaceDetails: function () {
      this.$state.go('metrics.dashboard.namespace.details', {nodeName: this.nodeName});
    }
  });

})();
