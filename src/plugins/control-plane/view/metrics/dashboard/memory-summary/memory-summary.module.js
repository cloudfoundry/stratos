(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.memory-summary', [
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.memory-summary', {
      url: '/memory',
      params: {
        newlyCreated: false
      },
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/memory-summary/memory-summary.html',
      controller: MemorySummaryController,
      controllerAs: 'memorySummaryCtrl',
      ncyBreadcrumb: {
        label: '{{metricsDashboardCtrl.endpoint.name}}',
        parent: 'cp.tiles'
      }
    });
  }

  MemorySummaryController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function MemorySummaryController($q, $state, $stateParams, modelManager, utilsService, metricsDataService) {
    var that = this;
    this.model = modelManager.retrieve('cloud-foundry.model.application');

    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    this.utilsService = utilsService;
    this.guid = $stateParams.guid;
    this.showCardLayout = true;

    this.tableColumns = [
      {name: gettext('Node'), value: 'spec.hostname'},
      {name: gettext('Memory Usage'), value: 'metrics.memory_usage', noSort: true},
      {name: gettext('Memory Spark Line'), value: 'metrics.memory_usage', descendingFirst: true}
    ];

    this.metricsDataService = metricsDataService;
    if (!_.has(metricsDataService, 'memorySummary.showCardLayout')) {
      this.metricsDataService.memorySummary = {};
      this.metricsDataService.memorySummary.showCardLayout = true;
    }

    this.sortFilters = [
      {
        label: gettext('Hostname'),
        value: 'spec.hostname'
      },
      {
        label: gettext('Utilization'),
        value: 'metric.memory_utilization'
      }
    ];

    this.defaultFilter = {
      label: gettext('Hostname'),
      value: 'spec.hostname'
    };

    function init() {
      metricsDataService.setSortFilters('memory', that.sortFilters, that.defaultFilter);
      that.nodes = metricsDataService.getNodes(that.guid);
      return $q.resolve()
        .then(function () {
          // Enrich nodes information

          var allMetricPromises = [];
          _.each(that.nodes, function (node, key) {

            var metricPromises = [];
            metricPromises.push(that.metricsModel.getLatestMetricDataPoint('memory_node_utilization_gauge',
              that.metricsModel.makeNodeNameFilter(node.spec.metricsNodeName)));
            metricPromises.push(that.metricsModel.getMetrics('memory_node_utilization_gauge',
              that.metricsModel.makeNodeNameFilter(node.spec.metricsNodeName)));
            metricPromises.push(that.metricsModel.getNodeMemoryLimit(node.spec.metricsNodeName));

            var promises = $q.all(metricPromises)
              .then(function (metrics) {
                that.nodes[key].metrics = {};
                that.nodes[key].metrics.memory_usage = metrics[0].toFixed(2);
                that.nodes[key].metrics.memoryUsageData = metrics[1].timeSeries;
                that.nodes[key].metrics.memoryLimit = metrics[2];
              });

            allMetricPromises.push(promises);

          });
          return allMetricPromises;
        });
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.memory-summary', $state, init);

  }

  angular.extend(MemorySummaryController.prototype, {

    getMemoryUsageValue: function (node) {
      return this.utilsService.bytesToHumanSize(parseFloat(node.metrics.memory_usage) * node.metrics.memoryLimit);
    },

    fetchMemoryLimit: function (node) {
      return this.utilsService.bytesToHumanSize(node.metrics.memoryLimit);
    }
  });

})();
