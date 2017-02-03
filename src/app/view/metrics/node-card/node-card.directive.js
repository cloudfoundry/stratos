(function () {
  'use strict';

  angular
    .module('app.view.metrics')
    .directive('nodeCard', nodeCard);

  nodeCard.$inject = ['app.basePath'];

  function nodeCard(path) {
    return {
      bindToController: {
        nodeName: '='
      },
      controller: NodeCardController,
      controllerAs: 'nodeCardCtrl',
      scope: {},
      templateUrl: path + 'view/metrics/node-card/node-card.html'
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

    var interval = $interval(function () {
      that.updateCpuUtilization();
      that.updateMemoryUtilization();
      that.updateNetworkDataTransmitted();
      that.updateNetworkDataReceived();
      that.updateMemoryUtilization();
      that.updateNodeUptime();
    }, 30000);

    this.cardData = {
      title: this.nodeName
    };

    this.options = {
      chart: {
        type: 'discreteBarChart',
        height: 450,
        margin : {
          top: 20,
          right: 20,
          bottom: 60,
          left: 55
        },
        x: function(d){ return d.label; },
        y: function(d){ return d.value; },
        showValues: true,
        valueFormat: function(d){
          return d3.format(',.4f')(d);
        },
        transitionDuration: 500,
        xAxis: {
          axisLabel: 'X Axis'
        },
        yAxis: {
          axisLabel: 'Y Axis',
          axisLabelDistance: 30
        }
      }
    };

    this.data =  [{
      key: "Cumulative Return",
      values: [
        { "label" : "A" , "value" : -29.765957771107 },
        { "label" : "B" , "value" : 0 },
        { "label" : "C" , "value" : 32.807804682612 },
        { "label" : "D" , "value" : 196.45946739256 },
        { "label" : "E" , "value" : 0.19434030906893 },
        { "label" : "F" , "value" : -98.079782601442 },
        { "label" : "G" , "value" : -13.925743130903 },
        { "label" : "H" , "value" : -5.1387322875705 }
      ]
    }];

    $scope.$on('$destroy', function () {
      $interval.cancel(interval);
    });

    function init() {
      // prefetch cpu-usage and memory data
      return $q.all([that.updateCpuUtilization(),
        that.updateMemoryUtilization(),
        that.updateNodeUptime(),
        that.updateNetworkDataTransmitted(),
        that.updateNetworkDataReceived(),
        that.fetchLimitMetrics()]);
    }

    utilsService.chainStateResolve('metrics.dashboard', $state, init);
  }

  angular.extend(NodeCardController.prototype, {

    getCardData: function () {
      return this.cardData;
    },

    updateCpuUtilization: function () {
      var that = this;
      return this.metricsModel.getCpuUtilization(this.metricsModel.makeNodeNameFilter(this.nodeName))
        .then(function (metricsData) {
          that.metricsData[metricsData.metricName] = [metricsData];
        });
    },

    updateMemoryUtilization: function () {
      var that = this;
      return this.metricsModel.getMemoryUtilization(this.metricsModel.makeNodeNameFilter(this.nodeName))
        .then(function (metricsData) {
          that.metricsData[metricsData.metricName] = [metricsData];
        });
    },

    updateNetworkDataTransmitted: function () {
      var that = this;
      return this.metricsModel.updateNetworkDataTransmitted(this.metricsModel.makeNodeNameFilter(this.nodeName))
        .then(function (metricsData) {
          that.metricsData[metricsData.metricName] = [metricsData];
        });
    },

    updateNetworkDataReceived: function () {
      var that = this;
      return this.metricsModel.updateNetworkDataReceived(this.metricsModel.makeNodeNameFilter(this.nodeName))
        .then(function (metricsData) {
          that.metricsData[metricsData.metricName] = [metricsData];
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
      var promises = [this.metricsModel.getNodeCpuLimit(this.nodeName),
        this.metricsModel.getNodeMemoryLimit(this.nodeName)];
      this.$q.all(promises).then(function (limits) {
        that.cpuLimit = limits[0];
        // Memory limit is in bytes, convert to Mb for the filter
        that.memoryLimit = parseInt(limits[1], 10) / (1024 * 1024);
      });
    },

    hasMetrics: function (metricName) {
      return _.has(this.metricsData, metricName) && _.first(this.metricsData[metricName]).dataPoints.length > 0;
    },

    namespaceDetails: function () {
      this.$state.go('metrics.dashboard.namespace.details', {nodeName: this.nodeName});
    }
  });

})();
