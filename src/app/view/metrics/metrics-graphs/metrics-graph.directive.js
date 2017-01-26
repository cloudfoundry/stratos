(function () {
  'use strict';

  angular
    .module('app.view.metrics')
    .directive('metricsGraphs', metricsGraphs);

  metricsGraphs.$inject = ['app.basePath'];

  function metricsGraphs(path) {
    return {
      bindToController: {
        namespaceName: '='
      },
      controller: MetricsGraphsController,
      controllerAs: 'metricGraphsCtrl',
      templateUrl: path + 'view/metrics/metrics-graphs/metrics-graphs.html'
    };
  }

  MetricsGraphsController.$inject = [
    '$interval',
    '$state',
    '$q',
    'app.model.modelManager',
    'app.utils.utilsService'
  ];

  function MetricsGraphsController($interval, $state, $q, modelManager, utils) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    var filter;

    this.hasMetrics = hasMetrics;

    if (this.namespaceName) {
      filter = this.metricsModel.makeNameSpaceFilter(this.namespaceName);
    }

    function init() {
      return $q.all([that.metricsModel.getCpuUsageRate(filter),
        that.metricsModel.getMemoryUsage(filter)]);
    }

    utils.chainStateResolve('metrics', $state, init);

    // continually update data
    $interval(function () {
      that.metricsModel.getCpuUsageRate(filter);
      that.metricsModel.getMemoryUsage(filter);
    }, 30000);

    function hasMetrics(metricName) {
      var hasMetric = false;
      _.each(that.metricsModel.cumulativeMetrics, function (metric) {
        if (!hasMetric){
          hasMetric = (metric.metricName === metricName);
        }
      })
      return hasMetric;
    }
  }
})();
