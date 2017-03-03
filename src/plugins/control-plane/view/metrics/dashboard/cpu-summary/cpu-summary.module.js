(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.cpu-summary', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.cpu-summary', {
      url: '/cpu',
      params: {
        newlyCreated: false
      },
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/cpu-summary/cpu-summary.html',
      controller: CpuSummaryController,
      controllerAs: 'cpuSummaryCtrl',
      ncyBreadcrumb: {
        label: '{{metricsDashboardCtrl.endpoint.name}}',
        parent: 'cp.tiles'
      }
    });
  }

  CpuSummaryController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function CpuSummaryController($q, $state, $stateParams, modelManager, utilsService, metricsDataService) {
    var that = this;

    this.guid = $stateParams.guid;
    this.metricsModel = modelManager.retrieve('control-plane.model.metrics');
    this.metricsDataService = metricsDataService;

    this.sortFilters = [
      {
        label: gettext('Hostname'),
        value: 'spec.hostname'
      },
      {
        label: gettext('Utilization'),
        value: 'metric.cpu_utilization'
      }
    ];

    that.all = {
      metrics: {}
    };
    this.defaultFilter = {
      label: gettext('Hostname'),
      value: 'spec.hostname'
    };

    this.tableColumns = [
      {name: gettext('Node'), value: 'spec.hostname'},
      {name: gettext('CPU Usage'), value: 'metrics.cpuUtilization.latestDataPoint', descendingFirst: true},
      {name: gettext('CPU Spark Line'), value: 'metrics.cpu_usage', noSort: true}
    ];

    if (!_.has(metricsDataService, 'cpuSummary.showCardLayout')) {
      this.metricsDataService.cpuSummary = {};
      this.metricsDataService.cpuSummary.showCardLayout = true;
    }

    function init() {
      metricsDataService.setSortFilters('cpu', that.sortFilters, that.defaultFilter);
      that.nodes = metricsDataService.getNodes(that.guid);
      that.filteredNodes = [].concat(that.nodes);
      return $q.resolve()
        .then(function () {
          // Enrich nodes information

          var allMetricPromises = [];
          _.each(that.nodes, function (node, key) {

            var metricPromises = [];
            // cpu
            metricPromises.push(that.metricsModel.getMetrics('cpu_node_utilization_gauge',
              that.metricsModel.makeNodeNameFilter(node.spec.metricsNodeName)));
            metricPromises.push(that.metricsModel.getNodeCpuLimit(node.spec.metricsNodeName));
            metricPromises.push(that.metricsModel.getMetrics('cpu_usage_rate_gauge',
              that.metricsModel.makeNodeNameFilter(node.spec.metricsNodeName)));

            var promises = $q.all(metricPromises)
              .then(function (metrics) {
                that.nodes[key].metrics = {};
                that.nodes[key].metrics.cpuUtilization = metrics[0];
                that.nodes[key].metrics.cpuLimit = metrics[1];
                that.nodes[key].metrics.cpuUsageData = metrics[2];
              }).catch(function () {
                that.nodes[key].metrics = {};
                that.nodes[key].metrics.cpuUtilization = null;
                that.nodes[key].metrics.cpuLimit = null;
                that.nodes[key].metrics.cpuUsageData = null;
              });

            allMetricPromises.push(promises);
          });

          var allPromises = that.metricsModel.getMetrics('cpu_usage_rate_gauge',
            that.metricsModel.makeNodeNameFilter('*'))
            .then(function (metric) {
              that.all.metrics.cpuUsageData = metric;
            }).catch(function () {
              that.all.metrics.cpuUsageData = null;
            });
          allMetricPromises.push(allPromises);

          return allMetricPromises;
        });
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.cpu-summary', $state, init);

  }

  angular.extend(CpuSummaryController.prototype, {
    getCpuUsageValue: function (node) {
      return Math.ceil(parseFloat(node.metrics.cpuUtilization.latestDataPoint) * node.metrics.cpuLimit);
    },

    fetchCpuLimit: function (node) {
      return node.metrics.cpuLimit;
    }
  });

})();
