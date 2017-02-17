(function () {
  'use strict';

  angular
    .module('control-plane.view.metrics.dashboard.data-traffic-summary.list', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cp.metrics.dashboard.data-traffic-summary.list', {
      url: '/list',
      params: {
        guid: ''
      },
      controller: CpuListViewController,
      controllerAs: 'cpuListViewCtrl',
      scope: {},
      templateUrl: 'plugins/control-plane/view/metrics/dashboard/data-traffic-summary/data-traffic-list-view/data-traffic-list-view.html'

    });
  }

  CpuListViewController.$inject = [
    '$q',
    '$state',
    '$stateParams',
    'app.model.modelManager',
    'app.utils.utilsService',
    'control-plane.metrics.metrics-data-service'
  ];

  function CpuListViewController($q, $state, $stateParams, modelManager, utilsService, metricsDataService) {

    var that = this;
    this.metricsModel = modelManager.retrieve('cloud-foundry.model.metrics');
    var controlPlaneModel = modelManager.retrieve('control-plane.model');
    this.guid = $stateParams.guid;
    this.$q = $q;
    this.nodes = [];


    this.tableColumns = [
      {name: gettext('Node'), value: 'spec.hostname'},
      {name: gettext('CPU Usage'), value: 'metrics.cpu_usage', noSort: true},
      {name: gettext('CPU Spark Line'), value: 'metrics.cpu_usage', descendingFirst: true}
    ];

    function init() {
      that.nodes = metricsDataService.getNodes(that.guid, true);
      return $q.resolve()
        .then(function () {
          // Enrich nodes information

          var allMetricPromises = [];
          _.each(that.nodes, function (node, key) {

            var metricPromises = [];
            // cpu
            metricPromises.push(that.metricsModel.getLatestMetricDataPoint('cpu_node_utilization_gauge',
              that.metricsModel.makeNodeNameFilter(node.spec.hostname)));

            var promises = $q.all(metricPromises)
              .then(function (metrics) {
                that.nodes[key].metrics = {};
                that.nodes[key].metrics.cpu_usage = (metrics[0] * 100).toFixed(2);
              });

            allMetricPromises.push(promises);

          });
          return allMetricPromises;
        });
    }

    utilsService.chainStateResolve('cp.metrics.dashboard.summary.list', $state, init);

  }

  angular.extend(CpuListViewController.prototype, {});

})();
