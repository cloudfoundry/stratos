(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard')
    .directive('nodeCountCard', nodeCountCard);

  nodeCountCard.$inject = ['app.basePath'];

  function nodeCountCard() {
    return {
      bindToController: {
        guid: '@'
      },
      controller: NodeCardCountController,
      controllerAs: 'nodeCountCardCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/summary/node-count-card/node-count-card.html'
    };
  }

  NodeCardCountController.$inject = [
    '$interval',
    '$state',
    '$scope',
    '$q',
    'app.model.modelManager',
    'control-plane.metrics.metrics-data-service',
    'app.utils.utilsService'
  ];

  function NodeCardCountController($interval, $state, $scope, $q, modelManager, metricsDataService, utilsService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');

    this.cardData = {
      title: 'Node Types'
    };

    this.nodeTypes = [];

    function init() {
      that.nodes = metricsDataService.getNodes(that.guid);
      that.processNodes(that.nodes);
      return $q.resolve();
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.summary', $state, init);
  }

  angular.extend(NodeCardCountController.prototype, {

    processNodes: function (nodes) {
      this.nodeTypes = [];
      var total = 0;
      total += this._processNode(nodes, 'Kubernetes Node', 'kubernetes_node');
      total += this._processNode(nodes, 'Kubernetes Master', 'kubernetes_master');
      total += this._processNode(nodes, 'Gluster FS', 'gluster');

      if (total !== nodes.length) {
        this.nodeTypes.push({
          label: 'Unknown',
          count: nodes.length - total,
          className: 'color-unknown',
          width: (nodes.length - total) / nodes.length * 100
        });
      }
    },

    _processNode: function (nodes, label, profile) {
      var matching = _.filter(nodes, function (n) {
        return n.spec.profile === profile;
      });

      this.nodeTypes.push({
        label: label,
        count: matching.length,
        className: 'color-' + this.nodeTypes.length,
        width: matching.length / nodes.length * 100
      });

      return matching.length;
    },

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
      this.metricsModel.getNodeUptime(this.nodeName)
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
