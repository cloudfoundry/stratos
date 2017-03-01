(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.cpu-summary', [
    ])
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
    this.model = modelManager.retrieve('cloud-foundry.model.application');

    this.guid = $stateParams.guid;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
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

    this.defaultFilter = {
      label: gettext('Hostname'),
      value: 'spec.hostname'
    };

    this.tableColumns = [
      {name: gettext('Node'), value: 'spec.hostname'},
      {name: gettext('CPU Usage'), value: 'metrics.cpu_usage', noSort: true},
      {name: gettext('CPU Spark Line'), value: 'metrics.cpu_usage', descendingFirst: true}
    ];

    if (!_.has(metricsDataService, 'cpuSummary.showCardLayout')) {
      this.metricsDataService.cpuSummary = {};
      this.metricsDataService.cpuSummary.showCardLayout = true;
    }

    function init() {
      metricsDataService.setSortFilters('cpu', that.sortFilters, that.defaultFilter);
      that.nodes = metricsDataService.getNodes(that.guid);
      return $q.resolve()
        .then(function () {
          // Enrich nodes information

          var allMetricPromises = [];
          _.each(that.nodes, function (node, key) {

            var metricPromises = [];
            // cpu
            metricPromises.push(that.metricsModel.getLatestMetricDataPoint('cpu_node_utilization_gauge',
              that.metricsModel.makeNodeNameFilter(node.spec.metricsNodeName)));
            metricPromises.push(that.metricsModel.getMetrics('cpu_node_utilization_gauge',
              that.metricsModel.makeNodeNameFilter(node.spec.metricsNodeName)));
            metricPromises.push(that.metricsModel.getNodeCpuLimit(node.spec.metricsNodeName));

            var promises = $q.all(metricPromises)
              .then(function (metrics) {
                that.nodes[key].metrics = {};
                that.nodes[key].metrics.cpu_usage = (metrics[0] * 100).toFixed(2) + ' %';
                that.nodes[key].metrics.cpuUsageData = metrics[1].timeSeries;
                that.nodes[key].cpuLimit = metrics[2];
              });

            allMetricPromises.push(promises);

          });
          return allMetricPromises;
        });
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.cpu-summary', $state, init);

  }

  angular.extend(CpuSummaryController.prototype, {});

})();
