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
    this.utilsService = utilsService;
    this.metricsData = {};

    var interval = $interval(function () {
      that.updateCpuUtilization();
      that.updateMemoryUtilization();
      that.updateNodeUptime();
    }, 30000);

    this.cardData = {
      title: this.nodeName
    };

    $scope.$on('$destroy', function () {
      $interval.cancel(interval);
    });

    function init() {
      // prefetch cpu-usage and memory data
      return $q.all([that.updateCpuUtilization(), that.updateMemoryUtilization(), that.updateNodeUptime()]);
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
          metricsData.metricName = 'cpu/utilization';
          that.metricsData[metricsData.metricName] = [metricsData];
        });
    },

    updateMemoryUtilization: function () {
      var that = this;
      return this.metricsModel.getMemoryUtilization(this.metricsModel.makeNodeNameFilter(this.nodeName))
        .then(function (metricsData) {
          metricsData.metricName = 'memory/utilization';
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

    hasMetrics: function (metricName) {
      return _.has(this.metricsData, metricName) && _.first(this.metricsData[metricName]).dataPoints.length > 0;
    },

    namespaceDetails: function () {
      this.$state.go('metrics.dashboard.namespace.details', {nodeName: this.nodeName});
    }
  });

})();
